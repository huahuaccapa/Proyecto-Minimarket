'use client';

import CatalogsView from './CatalogsView';

export default function BrandsView({ brands, onSave }) {
  return (
    <CatalogsView
      type="brand"
      items={brands}
      onSave={onSave}
    />
  );
}