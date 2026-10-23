'use strict';

const { baseUrl } = require('../lib/base-url');

const perform = async (z) => {
  const response = await z.request({ url: `${baseUrl()}/api/v1/projects/get.php`, method: 'GET' });
  return (response.data.projects || []).map((project) => ({
    id: project.public_id,
    public_id: project.public_id,
    project_name: project.project_name,
  }));
};

module.exports = {
  key: 'projects',
  noun: 'Project',
  display: {
    label: 'List Projects',
    description: 'Lists your AdSpendSpy projects (used for dropdowns).',
    hidden: true,
  },
  operation: {
    perform,
    sample: { id: 'prj_example', public_id: 'prj_example', project_name: 'Competitors' },
    outputFields: [
      { key: 'public_id', label: 'Project ID' },
      { key: 'project_name', label: 'Project Name' },
    ],
  },
};
