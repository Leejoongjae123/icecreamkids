import React from 'react';
import Image from 'next/image';
import { sanitizeAndFormat } from '@/utils';
import { TUTORIAL_TYPE, TutorialType } from '../../types';

const WorkAiTutorial: React.FC<{ type: TutorialType }> = ({ type }) => {
  if (!type) return null;
  return (
    <div className="tutorial-container">
      <div className="inner">
        <Image
          width={540}
          height={300}
          src={`/images/factAi/${TUTORIAL_TYPE[type]?.tutorialImg}.png`}
          alt={TUTORIAL_TYPE[type]?.tutorialText}
          priority
        />
        <p
          className="desc_tutorial"
          dangerouslySetInnerHTML={{
            __html: sanitizeAndFormat(TUTORIAL_TYPE[type]?.tutorialText),
          }}
        />
      </div>
    </div>
  );
};
export default WorkAiTutorial;
