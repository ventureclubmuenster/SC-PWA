export default {
  name: 'schedule',
  title: 'Schedule',
  type: 'document',
  fields: [
    { name: 'title', title: 'Title', type: 'string', validation: (Rule: { required: () => unknown }) => Rule.required() },
    { name: 'time', title: 'Start Time', type: 'datetime', validation: (Rule: { required: () => unknown }) => Rule.required() },
    { name: 'endTime', title: 'End Time', type: 'datetime' },
    { name: 'location', title: 'Location / Stage', type: 'string', validation: (Rule: { required: () => unknown }) => Rule.required() },
    {
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          { title: 'Workshop', value: 'workshop' },
          { title: 'Main Stage', value: 'main-stage' },
          { title: 'Panel', value: 'panel' },
          { title: 'Networking', value: 'networking' },
        ],
      },
      validation: (Rule: { required: () => unknown }) => Rule.required(),
    },
    { name: 'description', title: 'Description', type: 'text' },
    { name: 'speaker', title: 'Speaker', type: 'reference', to: [{ type: 'speaker' }] },
  ],
};
