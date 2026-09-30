// Resolve visible text against current reference data. IDs captured while typing
// are hints: query results can arrive later or a record can be deactivated.
const bpNormalizeReference = value => String(value ?? '').trim().replace(/\s+/g, ' ').toLowerCase();
function bpResolveSubmitterReferences({ projects, parties, contracts, packages, values }) {
  const projectText = bpNormalizeReference(values.projectName);
  const contractorText = bpNormalizeReference(values.contractorName);
  const contractText = bpNormalizeReference(values.contractNumber);
  const packageText = bpNormalizeReference(values.packageCode);
  const active = record => record?.id && record.activeStatusKey === 'Active';
  const project = projects.find(record => active(record) && projectText &&
    (bpNormalizeReference(record.projectName) === projectText || bpNormalizeReference(record.projectCode) === projectText))
    ?? projects.find(record => active(record) && record.id === values.projectId);
  const projectContractors = parties.filter(record => active(record) && record.project?.id === project?.id && record.partyTypeKey === 'Contractor');
  const projectContracts = contracts.filter(record => active(record) && record.project?.id === project?.id);
  const contractor = projectContractors.find(record => contractorText && bpNormalizeReference(record.organizationName) === contractorText)
    ?? projectContractors.find(record => record.id === values.contractorPartyId);
  const contract = projectContracts.find(record => contractText && bpNormalizeReference(record.contractNumber) === contractText)
    ?? projectContracts.find(record => record.id === values.contractId);
  const contractPackages = packages.filter(record => active(record) && record.contract?.id === contract?.id);
  const packageRecord = contractPackages.find(record => packageText && bpNormalizeReference(record.packageCode) === packageText)
    ?? contractPackages.find(record => record.id === values.packageId);
  return { project, contractor, contract, package: packageRecord, projectContractors, projectContracts, contractPackages };
}
