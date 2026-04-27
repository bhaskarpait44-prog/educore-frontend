import { useMemo, useState } from 'react'
import { MessageCircleMore, RefreshCw, Search, Send, Users } from 'lucide-react'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'

const ChatWorkspace = ({
  title,
  subtitle,
  accent = '#0f766e',
  selfRole,
  contacts = [],
  conversations = [],
  messages = [],
  activeConversation = null,
  loadingSidebar = false,
  loadingMessages = false,
  sending = false,
  onRefresh,
  onSelectConversation,
  onStartConversation,
  onSendMessage,
  conversationTitle,
  conversationMeta,
  contactTitle,
  contactMeta,
}) => {
  const [search, setSearch] = useState('')
  const [draft, setDraft] = useState('')

  const filteredConversations = useMemo(() => conversations.filter((item) => {
    const haystack = `${conversationTitle(item)} ${conversationMeta(item)}`.toLowerCase()
    return !search.trim() || haystack.includes(search.trim().toLowerCase())
  }), [conversations, conversationMeta, conversationTitle, search])

  const filteredContacts = useMemo(() => contacts.filter((item) => {
    const haystack = `${contactTitle(item)} ${contactMeta(item)}`.toLowerCase()
    return !search.trim() || haystack.includes(search.trim().toLowerCase())
  }), [contactMeta, contactTitle, contacts, search])

  return (
    <div className="space-y-5">
      <section
        className="rounded-[28px] border p-5 sm:p-6"
        style={{
          borderColor: 'var(--color-border)',
          background: `linear-gradient(135deg, ${accent}20, rgba(255,255,255,0.08) 55%, var(--color-surface) 100%)`,
        }}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
              {title}
            </h1>
            <p className="mt-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              {subtitle}
            </p>
          </div>
          <Button variant="secondary" icon={RefreshCw} onClick={onRefresh}>
            Refresh
          </Button>
        </div>
      </section>

      <section
        className="grid grid-cols-1 gap-5 xl:grid-cols-[360px_minmax(0,1fr)]"
      >
        <aside
          className="rounded-[28px] border p-4"
          style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
        >
          <div className="flex items-center gap-2 rounded-[20px] border px-3 py-3" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}>
            <Search size={16} style={{ color: 'var(--color-text-secondary)' }} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search chats or contacts"
              className="w-full bg-transparent text-sm outline-none"
              style={{ color: 'var(--color-text-primary)' }}
            />
          </div>

          <div className="mt-5">
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--color-text-muted)' }}>
              Conversations
            </h2>
            <div className="mt-3 space-y-2">
              {loadingSidebar ? (
                [...Array(4)].map((_, index) => (
                  <div key={index} className="h-20 animate-pulse rounded-[20px]" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
                ))
              ) : filteredConversations.length ? filteredConversations.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectConversation(item.id)}
                  className="w-full rounded-[20px] border px-4 py-3 text-left transition"
                  style={{
                    borderColor: Number(activeConversation?.id) === Number(item.id) ? accent : 'var(--color-border)',
                    backgroundColor: Number(activeConversation?.id) === Number(item.id) ? `${accent}12` : 'var(--color-surface)',
                  }}
                >
                  <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                    {conversationTitle(item)}
                  </p>
                  <p className="mt-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    {conversationMeta(item)}
                  </p>
                  <p className="mt-2 line-clamp-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    {item.last_message_text || 'No messages yet.'}
                  </p>
                </button>
              )) : (
                <p className="rounded-[20px] px-4 py-4 text-sm" style={{ backgroundColor: 'var(--color-surface-raised)', color: 'var(--color-text-secondary)' }}>
                  No conversations yet.
                </p>
              )}
            </div>
          </div>

          <div className="mt-6">
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--color-text-muted)' }}>
              Start New Chat
            </h2>
            <div className="mt-3 space-y-2 max-h-[340px] overflow-y-auto pr-1">
              {filteredContacts.length ? filteredContacts.map((item, index) => (
                <button
                  key={`${contactTitle(item)}-${item.subject_id || 'class'}-${item.student_id || item.teacher_id || index}`}
                  type="button"
                  onClick={() => onStartConversation(item)}
                  className="w-full rounded-[20px] border px-4 py-3 text-left transition"
                  style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}
                >
                  <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                    {contactTitle(item)}
                  </p>
                  <p className="mt-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    {contactMeta(item)}
                  </p>
                </button>
              )) : (
                <p className="rounded-[20px] px-4 py-4 text-sm" style={{ backgroundColor: 'var(--color-surface-raised)', color: 'var(--color-text-secondary)' }}>
                  No available contacts found.
                </p>
              )}
            </div>
          </div>
        </aside>

        <div
          className="rounded-[28px] border"
          style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
        >
          {!activeConversation ? (
            <div className="p-6">
              <EmptyState
                icon={Users}
                title="Select a chat"
                description="Choose an existing conversation or start a new one from the sidebar."
              />
            </div>
          ) : (
            <div className="flex h-[70vh] min-h-[560px] flex-col">
              <div className="border-b px-5 py-4" style={{ borderColor: 'var(--color-border)' }}>
                <p className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  {conversationTitle(activeConversation)}
                </p>
                <p className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  {conversationMeta(activeConversation)}
                </p>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-5">
                {loadingMessages ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, index) => (
                      <div key={index} className="h-16 animate-pulse rounded-[20px]" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
                    ))}
                  </div>
                ) : messages.length ? (
                  <div className="space-y-3">
                    {messages.map((message) => {
                      const mine = message.sender_role === selfRole
                      return (
                        <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                          <div
                            className="max-w-[80%] rounded-[22px] px-4 py-3"
                            style={{
                              backgroundColor: mine ? accent : 'var(--color-surface-raised)',
                              color: mine ? '#fff' : 'var(--color-text-primary)',
                            }}
                          >
                            <p className="whitespace-pre-wrap text-sm leading-6">{message.message_text}</p>
                            <p className="mt-2 text-[11px]" style={{ color: mine ? 'rgba(255,255,255,0.82)' : 'var(--color-text-muted)' }}>
                              {new Date(message.created_at).toLocaleString('en-IN')}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <EmptyState
                    icon={MessageCircleMore}
                    title="No messages yet"
                    description="Start the conversation with your first message."
                  />
                )}
              </div>

              <form
                className="border-t px-5 py-4"
                style={{ borderColor: 'var(--color-border)' }}
                onSubmit={async (event) => {
                  event.preventDefault()
                  if (!draft.trim()) return
                  await onSendMessage(draft)
                  setDraft('')
                }}
              >
                <div className="flex items-end gap-3">
                  <textarea
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    rows={3}
                    placeholder="Type your message"
                    className="min-h-[88px] flex-1 rounded-[22px] border px-4 py-3 text-sm outline-none"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)', color: 'var(--color-text-primary)' }}
                  />
                  <Button type="submit" variant="primary" icon={Send} loading={sending}>
                    Send
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export default ChatWorkspace
