// studio/schemas/product.ts
import {defineField, defineType} from 'sanity'

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
      title: 'Identifiant (slug)',
      type: 'slug',
      options: {
        source: 'name',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'type',
      title: 'Type',
      type: 'string',
      options: {
        list: [
          {title: 'Produit simple', value: 'product'},
          {title: 'Pack', value: 'pack'},
        ],
        layout: 'radio',
      },
      initialValue: 'product',
    }),
    defineField({
      name: 'image',
      title: 'Image principale',
      type: 'image',
      options: {
        hotspot: true, // Permet de recadrer l'image intelligemment
      },
    }),
    defineField({
      name: 'category',
      title: 'Catégorie',
      type: 'string',
    }),
    defineField({
      name: 'price_eur_day',
      title: 'Prix par jour (€)',
      type: 'number',
    }),
    defineField({
      name: 'featured',
      title: 'Mettre en avant',
      description: "Afficher cet élément sur la page d'accueil",
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'includes',
      title: 'Produits inclus (pour les packs)',
      type: 'array',
      of: [{type: 'reference', to: {type: 'product'}}],
      // Ne s'affiche que si le type est 'pack'
      hidden: ({parent}) => parent?.type !== 'pack',
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
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
