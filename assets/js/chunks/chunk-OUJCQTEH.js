var chapitreId=()=>document.body.dataset.chapitre||"";function chapitre(){let b=document.body.dataset;return(b.matiere?b.matiere+"/":"")+(b.chapitre||"")}export{chapitreId,chapitre};
