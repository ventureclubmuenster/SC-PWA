export default {
  name: 'partner',
  title: 'Partner / Exhibitor',
  type: 'document',
  fields: [
    { name: 'name', title: 'Company Name', type: 'string', validation: (Rule: { required: () => unknown }) => Rule.required() },
    { name: 'logo', title: 'Logo', type: 'image', options: { hotspot: true } },
    { name: 'description', title: 'Description', type: 'text' },
    { name: 'boothNumber', title: 'Booth Number', type: 'string' },
    {
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          { title: 'Gold', value: 'gold' },
          { title: 'Silver', value: 'silver' },
          { title: 'Bronze', value: 'bronze' },
        ],
      },
      validation: (Rule: { required: () => unknown }) => Rule.required(),
    },
    { name: 'website', title: 'Website', type: 'url' },
  ],
};
