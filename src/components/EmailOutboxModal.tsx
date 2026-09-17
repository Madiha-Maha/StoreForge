import React, { useState, useEffect } from 'react';
import { X, Mail, CheckCircle2, Clock, Eye, Send } from 'lucide-react';
import { TransactionalEmail } from '../types';

interface EmailOutboxModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmailOutboxModal: React.FC<EmailOutboxModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const [emails, setEmails] = useState<TransactionalEmail[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<TransactionalEmail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/emails')
      .then((res) => res.json())
      .then((data) => {
        setEmails(data);
        if (data.length > 0) setSelectedEmail(data[0]);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
      <div className="relative bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden border border-neutral-200 h-[88vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-200 bg-neutral-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-white">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-display font-bold text-base sm:text-lg">
                Transactional Email Outbox
              </h2>
              <p className="text-xs text-neutral-400">
                Automated customer communications dispatched via Resend / SendGrid engine
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content split pane */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Email list */}
          <div className="w-1/3 border-r border-neutral-200 overflow-y-auto bg-neutral-50/60 divide-y divide-neutral-100">
            {emails.length === 0 ? (
              <div className="p-6 text-center text-xs text-neutral-400">
                No emails dispatched yet. Complete an order to generate one!
              </div>
            ) : (
              emails.map((em) => {
                const isSelected = selectedEmail?.id === em.id;
                return (
                  <div
                    key={em.id}
                    onClick={() => setSelectedEmail(em)}
                    className={`p-3.5 cursor-pointer transition-colors text-xs space-y-1 ${
                      isSelected ? 'bg-white border-l-4 border-neutral-900 shadow-sm' : 'hover:bg-neutral-100/70'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-neutral-900 truncate max-w-[150px]">
                        {em.to}
                      </span>
                      <span className="text-[10px] text-neutral-400">
                        {new Date(em.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-neutral-700 font-medium truncate">{em.subject}</p>
                    <span className="inline-block text-[10px] uppercase font-bold text-neutral-500 bg-neutral-200/60 px-1.5 py-0.5 rounded">
                      {em.type}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {/* Right Preview area */}
          <div className="flex-1 overflow-y-auto p-6 bg-white flex flex-col">
            {selectedEmail ? (
              <div className="space-y-4">
                <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 text-xs space-y-1">
                  <div>
                    <strong className="text-neutral-500">To:</strong>{' '}
                    <span className="font-semibold text-neutral-900">{selectedEmail.to}</span>
                  </div>
                  <div>
                    <strong className="text-neutral-500">Subject:</strong>{' '}
                    <span className="font-semibold text-neutral-900">{selectedEmail.subject}</span>
                  </div>
                  <div>
                    <strong className="text-neutral-500">Date:</strong>{' '}
                    <span className="text-neutral-600">{new Date(selectedEmail.sentAt).toLocaleString()}</span>
                  </div>
                </div>

                {/* Rendered HTML */}
                <div
                  className="p-6 rounded-2xl border border-neutral-200 bg-white shadow-sm"
                  dangerouslySetInnerHTML={{ __html: selectedEmail.htmlBody }}
                />
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-neutral-400">
                Select an email from the list to preview the responsive template.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
