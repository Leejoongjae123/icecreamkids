import React from 'react';

export interface ISearchBar {
  /**
   * title: 검색창 좌측 제목
   */
  title?: string;
  /**
   * className: 클래스 이름
   */
  className?: string;
  /**
   * searchValue: 사용자의 검색창 입력값
   */
  searchValue: string;
  /**
   * handleSearchValue: 검색창 입력시 실행되는 함수 (onChange)
   */
  handleChangeSearchValue?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /**
   * handleSearch: 검색 실행되는 함수 (enter, 돋보기 클릭)
   */
  handleSearch?: (value: string) => void;
  handleSelectOption?: (searchValue: string) => void;
  handleClearSearchValue?: () => void;
  searchHistoryKey?: string;
  searchHistoryLength?: number;
  canSearchMinLength?: number; // 검색할 수 있는 최소 글자
}
