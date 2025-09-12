// schemas/product.js

export default {
  name: 'product',
  title: 'Produit / Pack',
  type: 'document',
  fields: [
    {
      name: 'name',
      title: 'Nom',
      type: 'string',
      validation: Rule => Rule.required(),
    },
    {
      name: 'slug',
      title: 'Identifiant (slug)',
      type: 'slug',
      options: {
        source: 'name',
        maxLength: 96,
      },
      validation: Rule => Rule.required(),
    },
    {
      name: 'type',
      title: 'Type',
      type: 'string',
      options: {
        list: [
          { title: 'Produit simple', value: 'product' },
          { title: 'Pack', value: 'pack' },
        ],
        layout: 'radio',
      },
      initialValue: 'product',
    },
    {
      name: 'image',
      title: 'Image principale',
      type: 'image',
      options: {
        hotspot: true, // Permet de recadrer l'image intelligemment
      },
    },
    {
      name: 'category',
      title: 'Catégorie',
      type: 'string',
    },
    {
      name: 'price_eur_day',
      title: 'Prix par jour (€)',
      type: 'number',
    },
    {
      name: 'featured',
      title: 'Mettre en avant',
      description: "Afficher cet élément sur la page d'accueil",
      type: 'boolean',
    },
    {
      name: 'includes',
      title: 'Produits inclus (pour les packs)',
      type: 'array',
      of: [{ type: 'reference', to: { type: 'product' } }],
      // Ne s'affiche que si le type est 'pack'
      hidden: ({ parent }) => parent?.type !== 'pack',
    },
    {
      name: 'description',
      title: 'Description',
      type: 'text',
    },
    {
      name: 'order',
      title: 'Ordre d'affichage',
      type: 'number',
      description: 'Pour trier manuellement les éléments. Plus le chiffre est bas, plus il apparaît haut.',
    },
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'category',
      media: 'image',
    },
  },
};
