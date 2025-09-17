// studio/schemaTypes/product.ts
import {defineField, defineType} from 'sanity'
import {GeneratePackImageButton} from '../components/GeneratePackImageButton.tsx'

export default defineType({
  name: 'product',
  title: 'Produit / Pack',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Nom',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {source: 'name'},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: {hotspot: true},
    }),
    defineField({
      name: 'pricePerDay',
      title: 'Prix par jour (€)',
      type: 'number',
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
    }),
    defineField({
      name: 'category',
      title: 'Catégorie',
      type: 'string',
      options: {
        list: ['Image', 'Lumière', 'Audio', 'Packs'],
      },
    }),
    defineField({
      name: 'featured',
      title: 'En vedette sur la page d\'accueil',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'type',
      title: 'Type',
      type: 'string',
      options: {list: ['product', 'pack']},
      initialValue: 'product',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'includes',
      title: 'Produits inclus (pour les packs)',
      type: 'array',
      of: [{type: 'reference', to: {type: 'product'}}],
      hidden: ({parent}) => parent?.type !== 'pack',
    }),
    defineField({
      name: 'packImageGenerator',
      title: 'Générateur d\'image de Pack',
      type: 'string',
      components: {field: GeneratePackImageButton},
      hidden: ({parent}) => parent?.type !== 'pack',
    }),
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'category',
      media: 'image',
    },
  },
})

