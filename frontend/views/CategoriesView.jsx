'use client';

import CatalogsView from './CatalogsView';

export default function CategoriesView({ categories, onSave }) {
  return (
    <CatalogsView
      type="category"
      items={categories}
      onSave={onSave}
    />
  );
}