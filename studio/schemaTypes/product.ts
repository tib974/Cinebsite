// studio/schemaTypes/product.ts
import {defineField, defineType} from 'sanity'
import {GeneratePackImageButton} from '../components/GeneratePackImageButton.tsx'

export default defineType({
  name: 'product',
  title: 'Produit / Pack',
  type: 'document',
  fields: [
    defineField({ name: 'name', title: 'Nom', type: 'string' }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', options: {source: 'name'} }),
    defineField({ name: 'image', title: 'Image', type: 'image' }),
    defineField({ name: 'type', title: 'Type', type: 'string', options: { list: ['product', 'pack'] } }),
    defineField({ name: 'packImageGenerator', title: 'Générateur d\'image de Pack', type: 'string', components: { field: GeneratePackImageButton }, hidden: ({parent}) => parent?.type !== 'pack' }),
  ],
})
