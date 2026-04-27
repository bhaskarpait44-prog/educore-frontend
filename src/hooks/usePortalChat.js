import { useCallback, useEffect, useMemo, useState } from 'react'

const usePortalChat = ({
  getContacts,
  getConversations,
  createConversation,
  getMessages,
  sendMessage,
}) => {
  const [contacts, setContacts] = useState([])
  const [conversations, setConversations] = useState([])
  const [messages, setMessages] = useState([])
  const [activeConversationId, setActiveConversationId] = useState(null)
  const [loadingSidebar, setLoadingSidebar] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)

  const loadSidebar = useCallback(async ({ preserveSelection = true } = {}) => {
    setError(null)
    setLoadingSidebar(true)
    try {
      const [contactsRes, conversationsRes] = await Promise.all([
        getContacts(),
        getConversations(),
      ])

      const nextContacts = contactsRes?.data?.contacts || []
      const nextConversations = conversationsRes?.data?.conversations || []
      setContacts(nextContacts)
      setConversations(nextConversations)

      setActiveConversationId((current) => {
        if (preserveSelection && current && nextConversations.some((item) => Number(item.id) === Number(current))) {
          return current
        }
        return nextConversations[0]?.id || null
      })

      return { contacts: nextContacts, conversations: nextConversations }
    } catch (err) {
      setError(err?.message || 'Unable to load chats.')
      throw err
    } finally {
      setLoadingSidebar(false)
    }
  }, [getContacts, getConversations])

  const loadMessages = useCallback(async (conversationId) => {
    if (!conversationId) {
      setMessages([])
      return []
    }
    setError(null)
    setLoadingMessages(true)
    try {
      const res = await getMessages(conversationId)
      const rows = res?.data?.messages || []
      setMessages(rows)
      return rows
    } catch (err) {
      setError(err?.message || 'Unable to load messages.')
      throw err
    } finally {
      setLoadingMessages(false)
    }
  }, [getMessages])

  useEffect(() => {
    loadSidebar().catch(() => {})
  }, [loadSidebar])

  useEffect(() => {
    loadMessages(activeConversationId).catch(() => {})
  }, [activeConversationId, loadMessages])

  useEffect(() => {
    const timer = window.setInterval(() => {
      loadSidebar().catch(() => {})
      if (activeConversationId) loadMessages(activeConversationId).catch(() => {})
    }, 15000)

    return () => window.clearInterval(timer)
  }, [activeConversationId, loadMessages, loadSidebar])

  const openConversation = useCallback((conversationId) => {
    setActiveConversationId(conversationId)
  }, [])

  const startConversation = useCallback(async (payload) => {
    setError(null)
    const res = await createConversation(payload)
    const conversationId = res?.data?.conversation?.id || null
    await loadSidebar({ preserveSelection: false })
    if (conversationId) {
      setActiveConversationId(conversationId)
      await loadMessages(conversationId)
    }
    return conversationId
  }, [createConversation, loadMessages, loadSidebar])

  const postMessage = useCallback(async (messageText) => {
    if (!activeConversationId) return null
    setError(null)
    setSending(true)
    try {
      const res = await sendMessage(activeConversationId, { message_text: messageText })
      await Promise.all([
        loadMessages(activeConversationId),
        loadSidebar(),
      ])
      return res?.data?.message || null
    } catch (err) {
      setError(err?.message || 'Unable to send message.')
      throw err
    } finally {
      setSending(false)
    }
  }, [activeConversationId, loadMessages, loadSidebar, sendMessage])

  const activeConversation = useMemo(
    () => conversations.find((item) => Number(item.id) === Number(activeConversationId)) || null,
    [activeConversationId, conversations]
  )

  return {
    contacts,
    conversations,
    messages,
    activeConversationId,
    activeConversation,
    loadingSidebar,
    loadingMessages,
    sending,
    error,
    reloadSidebar: loadSidebar,
    reloadMessages: () => loadMessages(activeConversationId),
    openConversation,
    startConversation,
    postMessage,
  }
}

export default usePortalChat
