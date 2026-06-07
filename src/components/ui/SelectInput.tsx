'use client';

import { useId } from 'react';
import Select from 'react-select';

const customStyles = {
  control: (base: any, state: any) => ({
    ...base,
    borderColor: state.isFocused ? '#90b5e2' : '#d9dbde',
    boxShadow: state.isFocused ? '0 0 0 .25rem rgba(32, 107, 196, .25)' : 'none',
    '&:hover': {
      borderColor: state.isFocused ? '#90b5e2' : '#d9dbde'
    },
    borderRadius: '4px',
    minHeight: '36px',
  }),
  option: (base: any, state: any) => ({
    ...base,
    backgroundColor: state.isSelected ? '#206bc4' : state.isFocused ? '#f1f5f9' : 'white',
    color: state.isSelected ? 'white' : '#1d273b',
    cursor: 'pointer'
  })
};

export default function SelectInput({ name, options, defaultValue, placeholder, required }: any) {
  const instanceId = useId();
  // options should be an array of { label: string, value: string }
  const defaultOption = options.find((o: any) => o.value === defaultValue);

  return (
    <Select
      instanceId={instanceId}
      name={name}
      options={options}
      defaultValue={defaultOption}
      placeholder={placeholder || 'Seçiniz...'}
      styles={customStyles}
      isClearable={!required}
      classNamePrefix="react-select"
      noOptionsMessage={() => 'Kayıt bulunamadı'}
      theme={(theme) => ({
        ...theme,
        colors: {
          ...theme.colors,
          primary: '#206bc4',
        },
      })}
    />
  );
}
