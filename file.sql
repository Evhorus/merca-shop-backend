SELECT
  p.*,
  i.* f.name,
  f.value,
  v.*,
  d.id,
  d.productVariantId
FROM
  Product p
  LEFT JOIN Image i ON i.productId = p.id
  LEFT JOIN Feature f ON f.productId = p.id
  LEFT JOIN ProductVariant v ON v.productId = p.id
  LEFT JOIN ProductVariantDimension d ON d.productVariantId = v.id