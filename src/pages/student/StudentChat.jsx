import { useEffect } from 'react'
import * as studentApi from '@/api/studentApi'
import ChatWorkspace from '@/components/chat/ChatWorkspace'
import usePageTitle from '@/hooks/usePageTitle'
import usePortalChat from '@/hooks/usePortalChat'
import useToast from '@/hooks/useToast'

const StudentChat = () => {
  usePageTitle('Chat')

  const { toastError, toastSuccess } = useToast()
  const chat = usePortalChat({
    getContacts: studentApi.getStudentChatContacts,
    getConversations: studentApi.getStudentChatConversations,
    createConversation: studentApi.createStudentChatConversation,
    getMessages: studentApi.getStudentChatMessages,
    sendMessage: studentApi.sendStudentChatMessage,
  })

  useEffect(() => {
    if (chat.error) toastError(chat.error)
  }, [chat.error, toastError])

  return (
    <ChatWorkspace
      title="Teacher Chat"
      subtitle="Talk only with your assigned class teacher and subject teachers for the current class and section."
      accent="#7c3aed"
      selfRole="student"
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
          teacher_id: contact.teacher_id,
          subject_id: contact.subject_id,
        })
        toastSuccess(`Chat ready with ${contact.teacher_name}.`)
      }}
      onSendMessage={chat.postMessage}
      conversationTitle={(item) => item.teacher_name}
      conversationMeta={(item) => item.is_class_teacher_chat ? 'Class Teacher' : (item.subject_name || 'Subject Teacher')}
      contactTitle={(item) => item.teacher_name}
      contactMeta={(item) => item.scope_label || 'Teacher Chat'}
    />
  )
}

export default StudentChat
