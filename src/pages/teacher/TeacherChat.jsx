import { useEffect } from 'react'
import * as teacherApi from '@/api/teacherApi'
import ChatWorkspace from '@/components/chat/ChatWorkspace'
import usePageTitle from '@/hooks/usePageTitle'
import usePortalChat from '@/hooks/usePortalChat'
import useToast from '@/hooks/useToast'

const TeacherChat = () => {
  usePageTitle('Chat')

  const { toastError, toastSuccess } = useToast()
  const chat = usePortalChat({
    getContacts: teacherApi.getTeacherChatContacts,
    getConversations: teacherApi.getTeacherChatConversations,
    createConversation: teacherApi.createTeacherChatConversation,
    getMessages: teacherApi.getTeacherChatMessages,
    sendMessage: teacherApi.sendTeacherChatMessage,
  })

  useEffect(() => {
    if (chat.error) toastError(chat.error)
  }, [chat.error, toastError])

  return (
    <ChatWorkspace
      title="Student Chat"
      subtitle="Message only students from your assigned sections. Class teachers can chat in full-section scope, and subject teachers stay limited to their assigned subject scope."
      accent="#0f766e"
      selfRole="teacher"
      contacts={chat.contacts}
      conversations={chat.conversations}
      messages={chat.messages}
      activeConversation={chat.activeConversation}
      loadingSidebar={chat.loadingSidebar}
      loadingMessages={chat.loadingMessages}
      sending={chat.sending}
      onRefresh={() => Promise.all([chat.reloadSidebar(), chat.reloadMessages()])}
      onSelectConversation={chat.openConversation}
      onStartConversation={async (contact) => {
        await chat.startConversation({
          student_id: contact.student_id,
          subject_id: contact.subject_id,
        })
        toastSuccess(`Chat ready for ${contact.first_name} ${contact.last_name}.`)
      }}
      onSendMessage={chat.postMessage}
      conversationTitle={(item) => `${item.first_name} ${item.last_name}`}
      conversationMeta={(item) => {
        const scope = item.is_class_teacher_chat ? 'Class Teacher' : (item.subject_name || 'Subject Chat')
        return `${scope} | ${item.class_name} ${item.section_name} | Roll ${item.roll_number || '--'}`
      }}
      contactTitle={(item) => `${item.first_name} ${item.last_name}`}
      contactMeta={(item) => `${item.scope_label || 'Chat'} | ${item.class_name} ${item.section_name} | Roll ${item.roll_number || '--'}`}
    />
  )
}

export default TeacherChat
