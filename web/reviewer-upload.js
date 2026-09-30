ye=async ue=>{
  const file=ue.target.files?.[0];
  ue.target.value="";
  if(!file||!w)return;
  if(file.size>10*1024*1024){Ot.error("Files must be 10 MB or smaller.");return}
  if(file.name.length>850){Ot.error("File names must be 850 characters or shorter.");return}
  if(R.trim().length>2000){Ot.error("Evidence notes must be 2,000 characters or shorter.");return}
  bpSetUploading(true);
  try{
    const content=await N2e(file),uploadedTimestamp=new Date().toISOString();
    const reviewerDueDate=w.reviewerDueDate??w.statutoryDueDate??uploadedTimestamp;
    const selectedDocTypes=(Array.isArray(bpSelectedDocTypes)&&bpSelectedDocTypes.length)?bpSelectedDocTypes:(Array.isArray(r)&&r.length?r:[r||"Pay Cert"]);
    const selectedRevTypes=(Array.isArray(bpSelectedRevTypes)&&bpSelectedRevTypes.length)?bpSelectedRevTypes:(Array.isArray(e)&&e.length?e:[e||"QS"]);
    const primaryDoc=selectedDocTypes.includes("Pay Cert")?"PaymentCertificateArchitect":(selectedDocTypes.includes("QS Report")?"QSReport":(selectedDocTypes[0]||"Other"));
    const primaryRev=selectedRevTypes[0]||"QS";
    const payload={
      fileName:file.name,evidenceNote:R.trim()||void 0,fileContent:content,
      fileSize:file.size,mIMEType:file.type||"application/octet-stream",
      paymentApplication:{id:w.id,claimReference:w.claimReference},
      uploadedByEmail:re,uploadedByName:V,uploadedTimestamp,
      documentTypeKey:primaryDoc,reviewerTypeKey:primaryRev,
      documentTypeKeys:selectedDocTypes,reviewerTypeKeys:selectedRevTypes,
      reviewerDueDate,
      isLateSubmission:new Date(uploadedTimestamp)>new Date(reviewerDueDate),
      certifiedAmountMYR:K.certified
    };
    let saved,local=false;
    // The exported Dataverse File Content column accepts only 2,000 characters.
    // Data URLs beyond that limit must be stored in the browser for this preview.
    if(content.length<=1800){
      try{saved=await p.mutateAsync(payload)}catch{local=true}
    }else local=true;
    if(local){
      saved={...payload,id:crypto.randomUUID(),storageScope:"browser"};
      await bpSaveReviewerEvidence(saved);
      bpSetLocalEvidence(previous=>[saved,...previous]);
      Ot.success(`${file.name} attached in this browser. It is not available to other reviewers.`);
    }else{
      Ot.success(`${file.name} attached.`);
      try{await le("ReviewerEvidenceUploaded",saved,w)}
      catch{Ot.error("Attachment saved, but its audit entry could not be recorded.")}
    }
    A("");
  }catch(error){Ot.error(error instanceof Error?error.message:"Unable to attach the file.")}
  finally{bpSetUploading(false)}
}
