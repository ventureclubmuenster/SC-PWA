export default {
  name: 'speaker',
  title: 'Speaker',
  type: 'document',
  fields: [
    { name: 'name', title: 'Name', type: 'string', validation: (Rule: { required: () => unknown }) => Rule.required() },
    { name: 'photo', title: 'Photo', type: 'image', options: { hotspot: true } },
    { name: 'linkedin', title: 'LinkedIn URL', type: 'url' },
    { name: 'bio', title: 'Biography', type: 'text' },
  ],
};
