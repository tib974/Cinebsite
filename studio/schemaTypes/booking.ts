// studio/schemaTypes/booking.ts
import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'booking',
  title: 'Réservation',
  type: 'document',
  fields: [
    defineField({
      name: 'product',
      title: 'Produit / Pack réservé',
      type: 'reference',
      to: [{type: 'product'}],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'startDate',
      title: 'Date de début',
      type: 'date',
      options: {
        dateFormat: 'DD/MM/YYYY',
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'endDate',
      title: 'Date de fin',
      type: 'date',
      options: {
        dateFormat: 'DD/MM/YYYY',
      },
      validation: (Rule) =>
        Rule.required().min(
          Rule.valueOf('startDate'),
          'La date de fin ne peut pas être antérieure à la date de début.'
        ),
    }),
    defineField({
      name: 'notes',
      title: 'Notes (client, détails...)',
      type: 'text',
    }),
  ],
  preview: {
    select: {
      title: 'product.name',
      startDate: 'startDate',
      endDate: 'endDate',
    },
    prepare({title, startDate, endDate}) {
      const formattedStart = startDate ? new Date(startDate).toLocaleDateString('fr-FR') : ''
      const formattedEnd = endDate ? new Date(endDate).toLocaleDateString('fr-FR') : ''
      return {
        title: title || 'Réservation sans produit',
        subtitle: `${formattedStart} → ${formattedEnd}`,
      }
    },
  },
})
