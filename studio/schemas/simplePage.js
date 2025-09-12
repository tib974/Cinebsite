// schemas/simplePage.js

export default {
  name: 'simplePage',
  title: 'Page de Contenu',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Titre de la page',
      type: 'string',
    },
    {
      name: 'content',
      title: 'Contenu',
      type: 'array',
      of: [{ type: 'block' }], // Un éditeur de texte riche
    },
  ],
};
