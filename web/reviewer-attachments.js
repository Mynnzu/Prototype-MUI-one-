// Reviewer evidence that cannot fit in the exported Dataverse text column is
// kept in IndexedDB for this preview workspace. The UI labels those records.
const Sk=e=>e<1024*1024?`${Math.max(1,Math.round(e/1024))} KB`:`${(e/(1024*1024)).toFixed(1)} MB`,
N2e=e=>new Promise((t,r)=>{const n=new FileReader;n.onload=()=>t(String(n.result)),n.onerror=()=>r(new Error("The selected file could not be read.")),n.readAsDataURL(e)}),
S2e=async e=>{const t=new TextEncoder().encode(e),r=await crypto.subtle.digest("SHA-256",t);return`SHA256: ${Array.from(new Uint8Array(r)).map(n=>n.toString(16).padStart(2,"0")).join("")}`};

const bpDocTypeOptions = ['Pay Cert', 'QS Report', 'Other'];
const bpReviewerTypeOptions = ['QS', 'Architect / Engineer', 'S.O.', 'Contractor'];

function bpDocTypeLabel(key) {
  if (key === 'PaymentCertificateArchitect' || key === 'Pay Cert') return 'Pay Cert';
  if (key === 'QSReport' || key === 'QS Report') return 'QS Report';
  if (key === 'Other') return 'Other';
  return key || 'Pay Cert';
}

function bpLoadProjectDocuments(claimReference, contractorOrganization) {
  if (!claimReference) return [];
  let docs = [];
  try {
    const raw = localStorage.getItem('buildpay-documents-' + claimReference);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) docs = parsed;
    }
  } catch {}
  if (!docs.length) {
    docs = [
      {
        id: `contractor-doc-${claimReference}`,
        name: `${claimReference}-Contractor-Valuation.pdf`,
        size: 248600,
        type: 'application/pdf',
        previewUrl: 'data:application/pdf;base64,JVBERi0xLjQKJeLjz9MKMSAwIG9iaiA8PC9UeXBlIC9DYXRhbG9nIC9QYWdlcyAyIDAgUiA+PiBlbmRvYmoKMiAwIG9iaiA8PC9UeXBlIC9QYWdlcyAvS2lkcyBbMyAwIFJdIC9Db3VudCAxID4+IGVuZG9iagozIDAgb2JqIDw8L1R5cGUgL1BhZ2UgL1BhcmVudCAyIDAgUiAvTWVkaWFCb3ggWzAgMCA2MTIgNzkyXSAvQ29udGVudHMgNCAwIFIgPj4gZW5kb2JqCjQgMCBvYmoAICA8PC9MZW5ndGggNTEgPj4gc3RyZWFtCkJUCi9GMSAxMiBUZgpDYW52YXMgc3VwcG9ydGluZyBkb2N1bWVudCBmb3IgQnVpbGRQYXkKRVQKZW5kc3RyZWFtCmVuZG9iago1IDAgb2JqIDw8L1R5cGUgL0ZvbnQgL1N1YnR5cGUgL1R5cGUxIC9CYXNlRm9udCAvSGVsdmV0aWNhID4+IGVuZG9iagp4cmVmCjAgNgowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMTUgMDAwMDAgbiAKMDAwMDAwMDA2OCAwMDAwMCBuIAowMDAwMDAwMTI1IDAwMDAwIG4gCjAwMDAwMDAyMjUgMDAwMDAgbiAKMDAwMDAwMDMyNiAwMDAwMCBuIAp0cmFpbGVyIDw8L1NpemUgNiAvUm9vdCAxIDAgUiA+PgpzdGFydHhyZWYKNDE0CiUlRU9G'
      }
    ];
  }
  return docs;
}

function bpCheckCanRecommend(records) {
  if (!Array.isArray(records) || records.length === 0) return false;
  const hasPayCert = records.some(r =>
    (Array.isArray(r.documentTypeKeys) && (r.documentTypeKeys.includes('Pay Cert') || r.documentTypeKeys.includes('PaymentCertificateArchitect'))) ||
    r.documentTypeKey === 'PaymentCertificateArchitect' ||
    r.documentTypeKey === 'Pay Cert'
  );
  const hasQSReport = records.some(r =>
    (Array.isArray(r.documentTypeKeys) && (r.documentTypeKeys.includes('QS Report') || r.documentTypeKeys.includes('QSReport'))) ||
    r.documentTypeKey === 'QSReport' ||
    r.documentTypeKey === 'QS Report'
  );
  return hasPayCert && hasQSReport;
}

function bpMultiSelectTagList({ title, options, selected, onChange }) {
  const current = Array.isArray(selected) ? selected : [selected].filter(Boolean);
  const toggle = (opt) => {
    const next = current.includes(opt)
      ? current.filter(item => item !== opt)
      : [...current, opt];
    onChange(next.length ? next : [opt]);
  };
  const remove = (opt) => {
    if (current.length <= 1) return;
    onChange(current.filter(item => item !== opt));
  };

  return D.createElement('div', { className: 'space-y-2' },
    D.createElement('div', { className: 'flex items-center justify-between' },
      D.createElement('label', { className: 'text-sm font-medium leading-none select-none' }, title),
      D.createElement('span', { className: 'text-xs text-muted-foreground' }, `${current.length} selected`)
    ),
    D.createElement('div', { className: 'flex flex-wrap gap-1.5 min-h-[34px] p-2 rounded-md border bg-muted/40 items-center' },
      current.map(item =>
        D.createElement('span', {
          key: item,
          className: 'inline-flex items-center gap-1 rounded bg-primary text-primary-foreground px-2.5 py-1 text-xs font-semibold shadow-xs'
        },
          item,
          current.length > 1 && D.createElement('button', {
            type: 'button',
            onClick: () => remove(item),
            className: 'hover:opacity-75 focus:outline-none ml-1 font-bold text-sm cursor-pointer',
            'aria-label': `Remove ${item}`
          }, '×')
        )
      )
    ),
    D.createElement('div', { className: 'flex flex-wrap gap-1.5 pt-0.5' },
      options.map(opt => {
        const isSelected = current.includes(opt);
        return D.createElement('button', {
          key: opt,
          type: 'button',
          onClick: () => toggle(opt),
          className: `inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border cursor-pointer transition-all ${
            isSelected
              ? 'bg-primary/15 text-primary border-primary font-semibold shadow-xs'
              : 'bg-background hover:bg-muted text-muted-foreground border-input'
          }`,
          'aria-pressed': isSelected
        },
          isSelected ? '✓ ' : '+ ',
          opt
        );
      })
    )
  );
}

function bpProjectDocumentsCard({ projectDocs, claimReference, contractorOrganization, onPreview, onDownload }) {
  const docs = projectDocs || [];
  return D.createElement('section', { className: 'rounded-lg border p-4 bp-project-attachments bg-card mb-4' },
    D.createElement('div', { className: 'flex flex-wrap items-start justify-between gap-3 mb-3' },
      D.createElement('div', null,
        D.createElement('h3', { className: 'font-semibold flex items-center gap-2' },
          'Project supporting documents (Contractor submission)'
        ),
        D.createElement('p', { className: 'text-sm text-muted-foreground' },
          `Evidence and attachments submitted for ${claimReference || 'this claim'}${contractorOrganization ? ' by ' + contractorOrganization : ''}.`
        )
      ),
      D.createElement('span', { className: 'bp-badge bp-status-Submitted' },
        `${docs.length} file${docs.length === 1 ? '' : 's'}`
      )
    ),
    docs.length === 0
      ? D.createElement('div', { className: 'rounded-md bg-muted p-4 text-sm text-muted-foreground' },
          'No contractor supporting documents attached for this application.'
        )
      : D.createElement('div', { className: 'space-y-2' },
          docs.map(doc => {
            const fileName = doc.name || doc.fileName || 'Attachment';
            const fileSize = doc.size || doc.fileSize || 0;
            const fileType = doc.type || doc.mIMEType || 'document';
            return D.createElement('div', {
              key: doc.id || fileName,
              className: 'flex flex-wrap items-center justify-between gap-3 rounded-md border bg-muted/20 p-3 text-card-foreground'
            },
              D.createElement('div', { className: 'min-w-0' },
                D.createElement('p', { className: 'truncate text-sm font-semibold' }, fileName),
                D.createElement('p', { className: 'text-xs text-muted-foreground' },
                  `${Sk(fileSize)} · Contractor submission · ${fileType}`
                )
              ),
              D.createElement('div', { className: 'flex gap-2' },
                D.createElement('button', {
                  type: 'button',
                  className: 'bp-button bp-secondary',
                  style: { padding: '4px 10px', minHeight: '30px', fontSize: '11px' },
                  onClick: () => onPreview(doc)
                }, 'Preview'),
                D.createElement('button', {
                  type: 'button',
                  className: 'bp-button bp-secondary',
                  style: { padding: '4px 10px', minHeight: '30px', fontSize: '11px' },
                  onClick: () => onDownload(doc)
                }, 'Download')
              )
            );
          })
        )
  );
}

function bpReviewerEvidenceDb(){
  return new Promise((resolve,reject)=>{
    if(!window.indexedDB){reject(new Error("Browser document storage is unavailable."));return}
    const request=indexedDB.open("buildpay-review-evidence",1);
    request.onupgradeneeded=()=>request.result.createObjectStore("attachments",{keyPath:"id"});
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(request.error||new Error("Browser document storage could not be opened."));
    request.onblocked=()=>reject(new Error("Close other BuildPay tabs and try the upload again."));
  });
}
async function bpSaveReviewerEvidence(record){
  const db=await bpReviewerEvidenceDb();
  try{
    await new Promise((resolve,reject)=>{
      const tx=db.transaction("attachments","readwrite");
      tx.objectStore("attachments").put(record);
      tx.oncomplete=resolve;
      tx.onerror=()=>reject(tx.error||new Error("The document could not be stored in this browser."));
      tx.onabort=()=>reject(tx.error||new Error("The document could not be stored in this browser."));
    });
  }finally{db.close()}
}
async function bpLoadReviewerEvidence(applicationId){
  const db=await bpReviewerEvidenceDb();
  try{
    const records=await new Promise((resolve,reject)=>{
      const tx=db.transaction("attachments","readonly");
      const request=tx.objectStore("attachments").getAll();
      request.onsuccess=()=>resolve(request.result);
      request.onerror=()=>reject(request.error||new Error("Saved documents could not be loaded."));
    });
    return records.filter(record=>record.paymentApplication?.id===applicationId);
  }finally{db.close()}
}
