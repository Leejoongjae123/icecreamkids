import { Options } from 'html-to-image/src/types';
import { toPng } from 'html-to-image';
import { useAlertStore } from '@/hooks/store/useAlertStore';

type Page = Node[];

export default function usePrint() {
  const { showAlert } = useAlertStore();

  const waitForRender = () =>
    new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        setTimeout(resolve, 50); // 렌더 후 살짝 여유
        resolve();
      });
    });

  const print = async (images: string[] | string) => {
    const preIframe = document.querySelector('body iframe#iframeImage');
    if (preIframe) preIframe.remove();

    await waitForRender();

    const iframe = document.createElement('iframe');
    iframe.id = 'iframeImage';
    iframe.style.position = 'absolute';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) throw new Error('iframe 생성에 실패하였습니다.');

    doc.open();
    doc.write(`
          <html>
            <head>
              <title>print</title>
              <style>
                body {
                  margin: 0;
                  display: flex;
                  flex-direction: column;
                  justify-content: center;
                }
                img {
                  max-width: 100%;
                  height: auto;
                  page-break-after: always;
                }
              </style>
            </head>
            <body>
               ${Array.isArray(images) ? images.map((src) => `<img src="${src}" />`).join('') : `<img src="${images}" />`}
              <script>
                window.onload = function () {
                  window.focus();
                  window.print();
                  setTimeout(() => window.close(), 500);
                };
              </script>
            </body>
          </html>
        `);
    doc.close();

    const prevIframe = document.querySelector('body iframe#iframeImage');
    // iframe이 있는 경우 3초 후 삭제 처리
    if (prevIframe) {
      setTimeout(() => {
        prevIframe.remove();
      }, 3000);
    }
  };

  const getElementHeight = (element: HTMLElement) => {
    const marginTop = parseInt(window.getComputedStyle(element).getPropertyValue('margin-top'), 10);
    const marginBottom = parseInt(window.getComputedStyle(element).getPropertyValue('margin-bottom'), 10);

    return element.offsetHeight + marginTop + marginBottom;
  };

  const paginateElements = (elements: Element[], maxHeight: number, initialHeight = 0): Page[] => {
    const pages: Page[] = [[]];
    let currentHeight = initialHeight;
    let pageNum = 0;

    elements.forEach((el) => {
      const height = getElementHeight(el as HTMLElement);
      currentHeight += height;

      if (currentHeight > maxHeight) {
        currentHeight = height;
        pageNum++;
        pages[pageNum] = [];
      }
      pages[pageNum].push(el.cloneNode(true) as HTMLElement);
    });

    return pages;
  };

  const pageToImages = async (
    pages: Page[],
    elementWidth: number,
    renderPage: (page: Page, index: number) => HTMLElement,
    options: Options,
  ): Promise<string[]> => {
    const capturedImages: string[] = [];

    for (let i = 0; i < pages.length; i++) {
      const container = renderPage(pages[i], i);
      container.style.width = `${elementWidth}px`;
      document.body.appendChild(container);

      // eslint-disable-next-line no-await-in-loop
      await waitForRender();
      // eslint-disable-next-line no-await-in-loop
      const dataUrl = await toPng(container, {
        ...options,
        backgroundColor: '#FFF',
        pixelRatio: 4,
      }).finally(() => {
        document.body.removeChild(container);
      });
      capturedImages.push(dataUrl);
    }

    return capturedImages;
  };

  const printForStoryBoard = async (
    elementId: string,
    options: Options = { backgroundColor: '#FFF', pixelRatio: 4, includeQueryParams: true },
  ): Promise<void> => {
    try {
      const element = document.getElementById(elementId);
      if (!element) {
        console.error(`Element "${elementId}"를 찾을 수 없습니다.`);
        return;
      }
      const pageWidth = 1040;
      const pageHeight = 1558;
      // 페이지 계산을 위해 body 렌더링
      const storyBoard = element!.cloneNode(true);
      document.body.appendChild(storyBoard);

      const storyBoardDiv = document.querySelector('body >.group-writing.type-saved') as HTMLElement;
      storyBoardDiv.style.width = `${pageWidth}px`;
      const fieldset = storyBoardDiv.querySelector('.group-form fieldset') as HTMLElement;
      const children = Array.from(fieldset?.children ?? []);

      await waitForRender();
      const pages = paginateElements(children, pageHeight);
      document.body.removeChild(storyBoard);

      const renderPage = (page: Page) => {
        const div = document.createElement('div');
        div.classList.add('group-writing', 'type-saved');
        div.style.margin = '0';

        const form = document.createElement('form');
        form.classList.add('group-form');

        const fieldSet = document.createElement('fieldset');
        page.forEach((el) => fieldSet.appendChild(el));

        form.appendChild(fieldSet);
        div.appendChild(form);
        return div;
      };

      const images = await pageToImages(pages, pageWidth, renderPage, options);
      await print(images);
    } catch (error) {
      console.log(error);
      showAlert({ message: '인쇄중 오류가 발생했습니다.' });
    }
  };

  const printForStudentRecord = async (
    elementId: string,
    options: Options = { backgroundColor: '#FFF', pixelRatio: 4, includeQueryParams: true },
  ): Promise<void> => {
    try {
      const element = document.getElementById(elementId);
      if (!element) {
        console.error(`Element "${elementId}"를 찾을 수 없습니다.`);
        return;
      }

      const pageWidth = 1180;
      const pageHeight = 1658;

      const observationDiv = document.createElement('div');
      observationDiv.classList.add('doc-observation');
      observationDiv.appendChild(element!.cloneNode(true));
      document.body.appendChild(observationDiv);

      const container = document.querySelector('body >.doc-observation') as HTMLElement;
      container.style.width = `${pageWidth}px`;

      const title = container.querySelector('.group-report.group-title') as HTMLElement;
      const info = container.querySelector('.group-report.group-info') as HTMLElement;
      const observation = container.querySelector('.group-report.observation') as HTMLElement;
      const children = Array.from(observation?.children ?? []);

      const initialHeight = getElementHeight(title) + getElementHeight(info);
      await waitForRender();

      const pages = paginateElements(children, pageHeight, initialHeight);
      document.body.removeChild(observationDiv);

      const renderPage = (page: Page, index: number) => {
        const div = document.createElement('div');
        div.classList.add('doc-observation');

        if (index === 0) {
          div.appendChild(title.cloneNode(true));
          div.appendChild(info.cloneNode(true));
        }

        const report = document.createElement('div');
        report.classList.add('group-report');

        page.forEach((el) => report.appendChild(el));
        div.appendChild(report);

        return div;
      };

      const images = await pageToImages(pages, pageWidth, renderPage, options);
      await print(images);
    } catch (error) {
      console.log(error);
      showAlert({ message: '인쇄중 오류가 발생했습니다.' });
    }
  };

  const printForActivityCard = async (
    elementId: string,
    options: Options = { backgroundColor: '#FFF', pixelRatio: 4, includeQueryParams: true },
  ): Promise<void> => {
    try {
      const element = document.getElementById(elementId);
      if (!element) {
        console.error(`Element "${elementId}"를 찾을 수 없습니다.`);
        return;
      }

      const pageWidth = 1180;
      const pageHeight = 1658;

      const playPlanDiv = document.createElement('div');
      playPlanDiv.classList.add('doc-playplan');
      playPlanDiv.appendChild(element!.cloneNode(true));
      document.body.appendChild(playPlanDiv);

      const container = document.querySelector('body >.doc-playplan') as HTMLElement;
      container.style.width = `${pageWidth}px`;

      const contents = container.getElementsByClassName('list-content');
      for (let i = 0; i < contents.length; i++) {
        const p = contents[i] as HTMLElement;
        p.style.whiteSpace = 'nowrap';
      }

      const title = container.querySelector('.body-content.subject-content') as HTMLElement;
      const detail = container.querySelector('.body-content.detail-content') as HTMLElement;
      const children = Array.from(detail?.children ?? []);

      const initialHeight = getElementHeight(title);

      await waitForRender();
      const pages = paginateElements(children, pageHeight, initialHeight);

      document.body.removeChild(playPlanDiv);
      const renderPage = (page: Page, index: number) => {
        const div = document.createElement('div');
        div.classList.add('doc-playplan');

        if (index === 0) {
          div.appendChild(title.cloneNode(true));
        }

        const report = document.createElement('div');
        report.classList.add('body-content', 'detail-content');

        page.forEach((el) => report.appendChild(el));
        div.appendChild(report);

        return div;
      };

      const images = await pageToImages(pages, pageWidth, renderPage, options);
      await print(images);
    } catch (error) {
      console.log(error);
      showAlert({ message: '인쇄중 오류가 발생했습니다.' });
    }
  };

  const printForLectureReport = async (
    elementId: string,
    options: Options = { backgroundColor: '#FFF', pixelRatio: 4, includeQueryParams: true },
  ) => {
    try {
      const element = document.getElementById(elementId);
      if (!element) {
        console.error(`Element "${elementId}"를 찾을 수 없습니다.`);
        return;
      }

      const pageWidth = 1900;
      const pageHeight = 2658;

      const playPlanDiv = document.createElement('div');
      playPlanDiv.classList.add('doc-playreport');
      playPlanDiv.appendChild(element!.cloneNode(true));
      document.body.appendChild(playPlanDiv);

      const container = document.querySelector('body >.doc-playreport') as HTMLElement;
      container.style.width = `${pageWidth}px`;
      const thList = document.querySelectorAll('body >.doc-playreport th');
      const tdList = document.querySelectorAll('body >.doc-playreport td');
      const titleList = document.querySelectorAll('body >.doc-playreport .tit-report');
      const reportList = document.querySelectorAll('body >.doc-playreport .txt-report');
      thList.forEach((_element) => {
        const th = _element as HTMLElement;
        th.style.fontSize = '25px'; // 14
        th.style.lineHeight = '32px'; // 21
        th.style.padding = '21px 23px';
      });
      tdList.forEach((_element) => {
        const td = _element as HTMLElement;
        td.style.fontSize = '32px'; // 15
        td.style.lineHeight = '40px'; // 23
        td.style.padding = '32px 28px';
      });
      titleList.forEach((_element) => {
        const td = _element as HTMLElement;
        td.style.fontSize = '32px'; // 15
        td.style.lineHeight = '37px'; // 20
      });
      reportList.forEach((_element) => {
        const td = _element as HTMLElement;
        td.style.fontSize = '31px'; // 14
        td.style.lineHeight = '38px'; // 21
      });

      const info = container.querySelector('.body-content.body-info') as HTMLElement;
      const detail = container.querySelector('.body-content.body-detail ul') as HTMLElement;
      const children = Array.from(detail?.children ?? []);
      const initialHeight = getElementHeight(info);

      // 한 번에 전체 높이를 캡처
      await waitForRender();

      const dataUrl = await toPng(container, options);
      if (!dataUrl) throw new Error('전체 컨텐츠 캡처 실패');

      const pages: Page[] = [[]];
      let currentHeight = initialHeight;
      let pageNum = 0;

      for (let i = 0; i < children.length; i += 4) {
        const group = children.slice(i, i + 4);

        // 그룹 내에서 가장 높은 li 요소의 높이를 계산
        const maxHeight = Math.max(...group.map((el) => getElementHeight(el as HTMLElement)));
        currentHeight += maxHeight;

        if (currentHeight > pageHeight) {
          pageNum++;
          pages[pageNum] = [];
          currentHeight = maxHeight;
        }

        pages[pageNum].push(...group);
      }
      document.body.removeChild(playPlanDiv);

      const renderPage = (page: Page, index: number) => {
        const wrapper = document.createElement('div');
        wrapper.classList.add('doc-playreport');
        wrapper.style.paddingBottom = '1px';

        if (index === 0) {
          wrapper.appendChild(info.cloneNode(true));
        }

        const div = document.createElement('div');
        const ul = document.createElement('ul');
        div.classList.add('body-content', 'body-detail');
        ul.classList.add('list-thumbnail');
        wrapper.appendChild(div);
        div.appendChild(ul);

        page.forEach((el) => ul.appendChild(el));
        wrapper.appendChild(div);

        return wrapper;
      };

      const images = await pageToImages(pages, pageWidth, renderPage, options);
      await print(images);
    } catch (err) {
      console.error(err);
      showAlert({ message: '인쇄중 오류가 발생했습니다.' });
    }
  };

  return {
    printForLectureReport,
    printForStoryBoard,
    printForActivityCard,
    printForStudentRecord,
  };
}
