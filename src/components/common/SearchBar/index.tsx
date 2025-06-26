import React, { ChangeEvent, KeyboardEvent, useState } from 'react';
import { Input } from '@/components/common';
import { ISearchBar } from '@/components/common/SearchBar/types';

const SearchBar = ({
  title,
  className = 'util-search',
  searchValue,
  handleChangeSearchValue,
  handleSearch,
  handleSelectOption,
  handleClearSearchValue,
  searchHistoryKey = 'search-history',
  searchHistoryLength = 5,
  canSearchMinLength = 2,
}: ISearchBar) => {
  const optionList = JSON.parse(localStorage.getItem(searchHistoryKey) as string) || [];

  const [options, setOptions] = useState(optionList);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const saveSearchValueInLocalStorage = (value: string) => {
    let searches = JSON.parse(localStorage.getItem(searchHistoryKey) as string) || [];
    searches = searches.filter((item: string) => item !== value);

    searches.unshift(value);

    if (searches.length > searchHistoryLength) {
      searches.pop();
    }

    localStorage.setItem(searchHistoryKey, JSON.stringify(searches));
    setOptions(searches);
  };

  const isValidate = (value: string) => {
    if (!value) return false;
    if (value.length < canSearchMinLength) {
      setIsError(true);
      setErrorMessage('검색은 두글자 이상 가능합니다.');
      return false;
    }

    return true;
  };

  const handleInputSearch = (value: string | number | string[]) => {
    if (!isValidate(value as string)) return;

    saveSearchValueInLocalStorage(value as string);

    if (handleSearch) {
      handleSearch(value as string);
    }
  };

  const handleInputPressEnter = (e: KeyboardEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement;
    const { value } = target;

    if (!isValidate(value)) return;

    saveSearchValueInLocalStorage(value);

    if (handleSearch) {
      handleSearch(value);
    }
  };

  const handleInputSelectOption = (keyword: string) => {
    saveSearchValueInLocalStorage(keyword);

    if (handleSelectOption) {
      handleSelectOption(keyword);
    }
  };

  const handleDeleteOption = (value: string | number) => {
    const searches = JSON.parse(localStorage.getItem(searchHistoryKey) as string) || [];
    const index = searches.findIndex((element: string | number) => element === value);

    searches.splice(index, 1);
    localStorage.setItem(searchHistoryKey, JSON.stringify(searches));

    setTimeout(() => {
      setOptions(searches);
    }, 300);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setIsError(false);
    setErrorMessage('');

    if (handleChangeSearchValue) {
      handleChangeSearchValue(e);
    }
  };

  return (
    <div className={className}>
      {title && <strong className="tit-search">{title}</strong>}
      <Input
        id="normal"
        type="search"
        sizeType="large"
        placeholder="검색어를 입력하세요."
        hasDelBtn
        useSearchHistory
        isError={isError}
        errorMessage={errorMessage}
        options={options}
        value={searchValue}
        onChange={handleChange}
        onPressEnter={handleInputPressEnter}
        onSelectOption={handleInputSelectOption}
        onDeleteOption={handleDeleteOption}
        onSearch={handleInputSearch}
        onClear={handleClearSearchValue}
      />
    </div>
  );
};

export default SearchBar;
