// studio/schemas/project.ts
import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'project',
  title: 'Réalisation',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Titre',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Identifiant (slug)',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
    }),
    defineField({
      name: 'image',
      title: 'Image de couverture',
      type: 'image',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'url',
      title: 'Lien vidéo (YouTube, Vimeo)',
      type: 'url',
    }),
    defineField({
      name: 'date',
      title: 'Date de réalisation',
      type: 'date',
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
    }),
  ],
})
