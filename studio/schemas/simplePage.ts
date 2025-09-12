// studio/schemas/simplePage.ts
import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'simplePage',
  title: 'Page de Contenu',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Titre de la page',
      type: 'string',
    }),
    defineField({
      name: 'content',
      title: 'Contenu',
      type: 'array',
      of: [{type: 'block'}], // Un éditeur de texte riche standard
    }),
  ],
})
