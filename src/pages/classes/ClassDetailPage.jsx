import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Pencil, Trash2, BookOpen, FlaskConical, Layers, Users, GripVertical, AlertCircle, Download } from 'lucide-react'
import useClasses  from '@/hooks/useClasses'
import useSubjects from '@/hooks/useSubjects'
import usePageTitle from '@/hooks/usePageTitle'
import { getStudents } from '@/api/students'
import { downloadClassStudentsPdf } from '@/api/classApi'
import useToast from '@/hooks/useToast'
import useSessionStore from '@/store/sessionStore'
import SectionForm from './components/SectionForm'
import SubjectForm from './components/SubjectForm'

const Modal=({open,onClose,title,children,wide})=>{
  if(!open)return null
  return(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{backgroundColor:'rgba(0,0,0,0.5)',backdropFilter:'blur(3px)'}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className={`w-full ${wide?'max-w-2xl':'max-w-lg'} max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">✕</button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

const Confirm=({open,onClose,onConfirm,title,description,loading})=>(
  <Modal open={open} onClose={onClose} title={title}>
    <div className="space-y-4">
      <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-950/30">
        <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5"/>
        <p className="text-sm text-gray-700 dark:text-gray-300">{description}</p>
      </div>
      <div className="flex justify-end gap-3">
        <button onClick={onClose} disabled={loading} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 disabled:opacity-50">Cancel</button>
        <button onClick={onConfirm} disabled={loading} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-60 flex items-center gap-2">
          {loading&&<svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>}
          {loading?'Deleting…':'Delete'}
        </button>
      </div>
    </div>
  </Modal>
)

const TypeBadge=({type})=>{
  const cfg={theory:{l:'Theory',I:BookOpen,c:'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'},practical:{l:'Practical',I:FlaskConical,c:'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'},both:{l:'Theory + Practical',I:Layers,c:'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'}}
  const {l,I,c}=cfg[type]||cfg.theory
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${c}`}><I size={10}/>{l}</span>
}

const CoreBadge=({isCore})=>(
  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${isCore?'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300':'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'}`}>{isCore?'Core':'Optional'}</span>
)

const formatStream=(stream)=>{
  if(!stream)return null
  const label = `${stream.charAt(0).toUpperCase()}${stream.slice(1)}`
  return stream === 'regular' ? label : `${label} Stream`
}

const CapBar=({enrolled,capacity})=>{
  const pct=capacity>0?Math.min((enrolled/capacity)*100,100):0
  const col=pct>=90?'bg-red-500':pct>=70?'bg-amber-500':'bg-emerald-500'
  return(
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden"><div className={`h-full rounded-full transition-all ${col}`} style={{width:`${pct}%`}}/></div>
      <span className={`text-xs font-medium whitespace-nowrap ${pct>=90?'text-red-600 dark:text-red-400':'text-gray-500 dark:text-gray-400'}`}>{enrolled}/{capacity}</span>
    </div>
  )
}

const SectionsTab=({classId,sections,isSaving,onCreate,onUpdate,onDelete,addOpen,setAddOpen})=>{
  const [editT,setEditT]=useState(null)
  const [delT,setDelT]=useState(null)
  const handleAdd=async d=>{const r=await onCreate(classId,d);if(r.success)setAddOpen(false)}
  const handleUpd=async d=>{const r=await onUpdate(classId,editT.id,d);if(r.success)setEditT(null)}
  const handleDel=async()=>{const r=await onDelete(classId,delT.id);if(r.success)setDelT(null)}
  return(
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">{sections.length} section{sections.length!==1?'s':''}</p>
        <button onClick={()=>setAddOpen(true)} className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-indigo-600 dark:bg-indigo-500 rounded-lg hover:bg-indigo-700 transition-colors"><Plus size={14}/>Add Section</button>
      </div>
      {sections.length===0?(
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
          <Users size={28} className="mx-auto text-gray-300 dark:text-gray-600 mb-3"/>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">No sections yet</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">Add sections like A, B, C to organise students</p>
          <button onClick={()=>setAddOpen(true)} className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">+ Add first section</button>
        </div>
      ):(
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead><tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">{['Section','Capacity','Enrolled','Availability','Status','Actions'].map(h=><th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50 bg-white dark:bg-gray-800">
              {sections.map(sec=>(
                <tr key={sec.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                  <td className="px-4 py-3 font-semibold text-gray-900 dark:text-gray-100">Section {sec.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{sec.capacity}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{sec.enrolled_count||0}</td>
                  <td className="px-4 py-3 min-w-36"><CapBar enrolled={sec.enrolled_count||0} capacity={sec.capacity}/></td>
                  <td className="px-4 py-3"><span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${sec.is_active?'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400':'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>{sec.is_active?'Active':'Inactive'}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={()=>setEditT(sec)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-lg transition-colors" title="Edit"><Pencil size={13}/></button>
                      {(sec.enrolled_count||0)===0
                        ?<button onClick={()=>setDelT(sec)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors" title="Delete"><Trash2 size={13}/></button>
                        :<span title="Cannot delete — students enrolled" className="p-1.5 text-gray-200 dark:text-gray-700 cursor-not-allowed"><Trash2 size={13}/></span>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Modal open={addOpen} onClose={()=>setAddOpen(false)} title="Add Section"><SectionForm onSubmit={handleAdd} onCancel={()=>setAddOpen(false)} isSaving={isSaving}/></Modal>
      <Modal open={!!editT} onClose={()=>setEditT(null)} title="Edit Section">{editT&&<SectionForm defaultValues={editT} onSubmit={handleUpd} onCancel={()=>setEditT(null)} isSaving={isSaving} isEdit/>}</Modal>
      <Confirm open={!!delT} onClose={()=>setDelT(null)} onConfirm={handleDel} title="Delete Section" description={`Delete section "${delT?.name}"? This cannot be undone.`} loading={isSaving}/>
    </div>
  )
}

const SubjectsTab=({classId,subjects,isSaving,onCreate,onUpdate,onDelete,onReorder,addOpen,setAddOpen})=>{
  const [editT,setEditT]=useState(null)
  const [delT,setDelT]=useState(null)
  const [local,setLocal]=useState(subjects)
  const [dragId,setDragId]=useState(null)

  useEffect(()=>setLocal(subjects),[subjects])

  const nextOrder=local.length>0?Math.max(...local.map(s=>s.order_number))+1:1

  const handleAdd=async d=>{const r=await onCreate(classId,d);if(r.success)setAddOpen(false)}
  const handleUpd=async d=>{const r=await onUpdate(classId,editT.id,d);if(r.success)setEditT(null)}
  const handleDel=async()=>{const r=await onDelete(classId,delT.id,'Deleted from class detail');if(r.success)setDelT(null)}

  const onDS=(e,id)=>{setDragId(id);e.dataTransfer.effectAllowed='move'}
  const onDO=(e,id)=>{e.preventDefault();if(id===dragId)return;const a=[...local];const fi=a.findIndex(s=>s.id===dragId);const ti=a.findIndex(s=>s.id===id);const[m]=a.splice(fi,1);a.splice(ti,0,m);setLocal(a.map((s,i)=>({...s,order_number:i+1})))}
  const onDrop=async()=>{setDragId(null);await onReorder(classId,local)}

  return(
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">{local.length} subject{local.length!==1?'s':''} · Drag to reorder</p>
        <button onClick={()=>setAddOpen(true)} className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-indigo-600 dark:bg-indigo-500 rounded-lg hover:bg-indigo-700 transition-colors"><Plus size={14}/>Add Subject</button>
      </div>
      {local.length===0?(
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
          <BookOpen size={28} className="mx-auto text-gray-300 dark:text-gray-600 mb-3"/>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">No subjects yet</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">Add subjects like Mathematics, Science, English</p>
          <button onClick={()=>setAddOpen(true)} className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">+ Add first subject</button>
        </div>
      ):(
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead><tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              {['','#','Subject','Code','Type','Core','Theory','Practical','Total','Actions'].map(h=><th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>)}
            </tr></thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50 bg-white dark:bg-gray-800">
              {local.map(sub=>(
                <tr key={sub.id} draggable onDragStart={e=>onDS(e,sub.id)} onDragOver={e=>onDO(e,sub.id)} onDrop={onDrop}
                  className={`hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors ${dragId===sub.id?'opacity-40 bg-indigo-50 dark:bg-indigo-950/20':''}`}>
                  <td className="px-3 py-3"><GripVertical size={14} className="text-gray-300 dark:text-gray-600 cursor-grab active:cursor-grabbing"/></td>
                  <td className="px-4 py-3 text-sm text-gray-400 dark:text-gray-500">{sub.order_number}</td>
                  <td className="px-4 py-3"><p className="text-sm font-medium text-gray-900 dark:text-gray-100">{sub.name}</p>{sub.description&&<p className="text-xs text-gray-400 dark:text-gray-500 truncate max-w-[160px]">{sub.description}</p>}</td>
                  <td className="px-4 py-3"><span className="text-xs font-mono bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded">{sub.code}</span></td>
                  <td className="px-4 py-3"><TypeBadge type={sub.subject_type}/></td>
                  <td className="px-4 py-3"><CoreBadge isCore={sub.is_core}/></td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{sub.theory_total_marks!=null?`${sub.theory_total_marks} / ${sub.theory_passing_marks}`:<span className="text-gray-300 dark:text-gray-600">—</span>}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{sub.practical_total_marks!=null?`${sub.practical_total_marks} / ${sub.practical_passing_marks}`:<span className="text-gray-300 dark:text-gray-600">—</span>}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-gray-100">{sub.combined_total_marks}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={()=>setEditT(sub)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-lg transition-colors" title="Edit"><Pencil size={13}/></button>
                      <button onClick={()=>setDelT(sub)}  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors" title="Delete"><Trash2 size={13}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Modal open={addOpen} onClose={()=>setAddOpen(false)} title="Add Subject" wide><SubjectForm onSubmit={handleAdd} onCancel={()=>setAddOpen(false)} isSaving={isSaving} nextOrderNumber={nextOrder}/></Modal>
      <Modal open={!!editT} onClose={()=>setEditT(null)} title="Edit Subject" wide>{editT&&<SubjectForm defaultValues={editT} onSubmit={handleUpd} onCancel={()=>setEditT(null)} isSaving={isSaving} isEdit/>}</Modal>
      <Confirm open={!!delT} onClose={()=>setDelT(null)} onConfirm={handleDel} title="Delete Subject" description={`Delete "${delT?.name}" (${delT?.code})? If marks have been entered in the active session this will be blocked.`} loading={isSaving}/>
    </div>
  )
}

const EnrolledStudentsTab=({students,isLoading,onOpenStudent})=>{
  if(isLoading){
    return(
      <div className="space-y-3 animate-pulse">
        {[1,2,3,4].map(i=>(
          <div key={i} className="h-12 rounded-lg bg-gray-100 dark:bg-gray-700/50"/>
        ))}
      </div>
    )
  }

  if(!students.length){
    return(
      <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
        <Users size={28} className="mx-auto text-gray-300 dark:text-gray-600 mb-3"/>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">No enrolled students in this class</p>
        <p className="text-xs text-gray-400 dark:text-gray-500">Students will appear here after enrollment</p>
      </div>
    )
  }

  return(
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
            {['Admission No','Student','Section','Roll No','Session','Status','Actions'].map(h=>(
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50 bg-white dark:bg-gray-800">
          {students.map(st=>(
            <tr key={st.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
              <td className="px-4 py-3 text-sm font-mono text-gray-600 dark:text-gray-300">{st.admission_no}</td>
              <td className="px-4 py-3">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{st.first_name} {st.last_name}</p>
              </td>
              <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{st.current_enrollment?.section||'—'}</td>
              <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{st.current_enrollment?.roll_number||'—'}</td>
              <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{st.current_enrollment?.session||'—'}</td>
              <td className="px-4 py-3">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${st.current_enrollment?.status==='active'?'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400':'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>
                  {st.current_enrollment?.status||'inactive'}
                </span>
              </td>
              <td className="px-4 py-3">
                <button onClick={()=>onOpenStudent(st.id)} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">View profile</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const ClassDetailPage=()=>{
  const {id}=useParams()
  const navigate=useNavigate()
  const [tab,setTab]=useState('sections')
  const [sectionAddOpen,setSectionAddOpen]=useState(false)
  const [subjectAddOpen,setSubjectAddOpen]=useState(false)
  const [enrolledStudents,setEnrolledStudents]=useState([])
  const [studentsLoading,setStudentsLoading]=useState(false)
  const [downloadingPdf,setDownloadingPdf]=useState(false)
  const {selectedClass,sections,isLoading,isSaving,fetchClassById,createSection,updateSection,deleteSection}=useClasses()
  const {subjects,fetchSubjects,createSubject,updateSubject,deleteSubject,reorderSubjects}=useSubjects()
  const { toastError, toastSuccess } = useToast()
  const { currentSession } = useSessionStore()

  usePageTitle(selectedClass?.name||'Class Detail')
  useEffect(()=>{fetchClassById(id);fetchSubjects(id)},[id])
  useEffect(()=>{
    const loadEnrolled=async()=>{
      if(!currentSession?.id){
        setEnrolledStudents([])
        return
      }
      setStudentsLoading(true)
      try{
        const res=await getStudents({class_id:id,session_id:currentSession.id,perPage:200,page:1})
        setEnrolledStudents(res?.data?.students||[])
      }catch(err){
        toastError(err.message||'Failed to load enrolled students')
        setEnrolledStudents([])
      }finally{
        setStudentsLoading(false)
      }
    }
    loadEnrolled()
  },[id,currentSession?.id,toastError])

  if(isLoading&&!selectedClass)return(
    <div className="space-y-5 animate-pulse">
      <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded-xl"/>
      <div className="h-4 w-72 bg-gray-100 dark:bg-gray-800 rounded-lg"/>
      <div className="h-64 rounded-2xl bg-gray-100 dark:bg-gray-800"/>
    </div>
  )

  if(!selectedClass)return(
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
      <AlertCircle size={32} className="text-gray-300 dark:text-gray-600 mb-3"/>
      <p className="text-gray-500 dark:text-gray-400 mb-4">Class not found</p>
      <button onClick={()=>navigate('/classes')} className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"><ArrowLeft size={14}/>Back to classes</button>
    </div>
  )

  const cls=selectedClass
  const openSectionCreate=()=>{setTab('sections');setSectionAddOpen(true)}
  const openSubjectCreate=()=>{setTab('subjects');setSubjectAddOpen(true)}
  const handleDownloadStudentsPdf = async () => {
    if (!currentSession?.id) {
      toastError('Please select an active session before downloading the PDF.')
      return
    }

    setDownloadingPdf(true)
    try {
      const response = await downloadClassStudentsPdf(id, { session_id: currentSession.id })
      const blob = response instanceof Blob ? response : new Blob([response], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${(cls?.name || 'class').replace(/[^a-z0-9-_]+/gi, '-')}-students.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.setTimeout(() => window.URL.revokeObjectURL(url), 5000)
      toastSuccess('Class student list PDF downloaded.')
    } catch (err) {
      toastError(err.message || 'Failed to download class student PDF.')
    } finally {
      setDownloadingPdf(false)
    }
  }

  return(
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <div className="flex-1">
          <button onClick={()=>navigate('/classes')} className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-3 transition-colors"><ArrowLeft size={15}/>Back to Classes</button>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{cls.name}</h1>
            {cls.display_name&&<span className="text-gray-400 dark:text-gray-500 text-base">{cls.display_name}</span>}
            {cls.stream&&<span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">{formatStream(cls.stream)}</span>}
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${cls.is_active?'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400':'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${cls.is_active?'bg-green-500':'bg-gray-400'}`}/>{cls.is_active?'Active':'Inactive'}
            </span>
          </div>
          <div className="flex flex-wrap gap-3 mt-2">
            {(cls.min_age||cls.max_age)&&<span className="text-xs text-gray-500 dark:text-gray-400">Age: {cls.min_age&&cls.max_age?`${cls.min_age}–${cls.max_age} yrs`:cls.min_age?`${cls.min_age}+ yrs`:`Up to ${cls.max_age} yrs`}</span>}
            <span className="text-xs text-gray-400 dark:text-gray-500">Order #{cls.order_number}</span>
            {cls.student_count>0&&<span className="text-xs text-gray-500 dark:text-gray-400">{cls.student_count} enrolled student{cls.student_count!==1?'s':''}</span>}
          </div>
          {cls.description&&<p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-xl">{cls.description}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={openSectionCreate}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-indigo-600 dark:bg-indigo-500 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus size={14}/>Add Section
          </button>
          <button
            onClick={openSubjectCreate}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-950/60 transition-colors"
          >
            <BookOpen size={14}/>Add Subject
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="flex border-b border-gray-200 dark:border-gray-700 px-2 pt-2 gap-1">
          {[{k:'sections',l:`Sections (${sections.length})`},{k:'subjects',l:`Subjects (${subjects.length})`},{k:'students',l:`Enrolled Students (${enrolledStudents.length})`}].map(t=>(
            <button key={t.k} onClick={()=>setTab(t.k)}
              className={`px-4 py-2.5 text-sm font-medium rounded-t-xl transition-colors ${tab===t.k?'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-500':'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>
              {t.l}
            </button>
          ))}
        </div>
        <div className="p-5">
          {tab==='sections'&&<SectionsTab classId={id} sections={sections} isSaving={isSaving} onCreate={createSection} onUpdate={updateSection} onDelete={deleteSection} addOpen={sectionAddOpen} setAddOpen={setSectionAddOpen}/>}
          {tab==='subjects'&&<SubjectsTab classId={id} subjects={subjects} isSaving={isSaving} onCreate={createSubject} onUpdate={updateSubject} onDelete={deleteSubject} onReorder={reorderSubjects} addOpen={subjectAddOpen} setAddOpen={setSubjectAddOpen}/>}
          {tab==='students'&&(
            <div className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Enrolled Students</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Download a PDF with school name, class name, section, student list, enrollment, and subjects.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadStudentsPdf}
                  disabled={downloadingPdf || studentsLoading || !currentSession?.id}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Download size={15} />
                  {downloadingPdf ? 'Preparing PDF...' : 'Download PDF'}
                </button>
              </div>
              <EnrolledStudentsTab students={enrolledStudents} isLoading={studentsLoading} onOpenStudent={(studentId)=>navigate(`/students/${studentId}`)}/>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
export default ClassDetailPage
