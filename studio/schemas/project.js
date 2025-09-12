// schemas/project.js

export default {
  name: 'project',
  title: 'Réalisation',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Titre',
      type: 'string',
      validation: Rule => Rule.required(),
    },
    {
      name: 'slug',
      title: 'Identifiant (slug)',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
    },
    {
      name: 'image',
      title: 'Image de couverture',
      type: 'image',
      options: {
        hotspot: true,
      },
    },
    {
      name: 'url',
      title: 'Lien vidéo (YouTube, Vimeo)',
      type: 'url',
    },
    {
      name: 'date',
      title: 'Date de réalisation',
      type: 'date',
    },
    {
      name: 'description',
      title: 'Description',
      type: 'text',
    },
  ],
};
