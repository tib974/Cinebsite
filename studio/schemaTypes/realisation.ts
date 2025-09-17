// studio/schemaTypes/realisation.ts
import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'realisation',
  title: 'Réalisation',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Titre', type: 'string' }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', options: {source: 'title'} }),
    defineField({ name: 'image', title: 'Image', type: 'image', options: {hotspot: true} }),
    defineField({ name: 'customer', title: 'Client', type: 'string' }),
    defineField({ name: 'description', title: 'Description', type: 'text' }),
    defineField({ name: 'url', title: 'URL du projet', type: 'url' }),
    defineField({ name: 'date', title: 'Date', type: 'date' }),
    defineField({ name: 'featured', title: 'En vedette', type: 'boolean', initialValue: false }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'customer',
      media: 'image',
    },
  },
})
