export default {
  name: 'workshop',
  title: 'Workshop',
  type: 'document',
  fields: [
    { name: 'title', title: 'Title', type: 'string', validation: (Rule: { required: () => unknown }) => Rule.required() },
    { name: 'description', title: 'Description', type: 'text' },
    { name: 'capacity', title: 'Capacity', type: 'number', validation: (Rule: { required: () => unknown }) => Rule.required() },
    { name: 'time', title: 'Start Time', type: 'datetime', validation: (Rule: { required: () => unknown }) => Rule.required() },
    { name: 'endTime', title: 'End Time', type: 'datetime' },
    { name: 'location', title: 'Location', type: 'string' },
    { name: 'host', title: 'Host / Company', type: 'string', validation: (Rule: { required: () => unknown }) => Rule.required() },
    { name: 'hostLogo', title: 'Host Logo', type: 'image', options: { hotspot: true } },
  ],
};
