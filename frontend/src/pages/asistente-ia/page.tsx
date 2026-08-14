import { useState, useRef, useEffect } from 'react';
import MainLayout from '@/components/feature/MainLayout';
import Button from '@/components/base/Button';
import Card from '@/components/base/Card';
import Badge from '@/components/base/Badge';
import {
  conversaciones,
  sugerenciasRapidas,
  conversacionInicial,
  respuestasIA,
} from '@/mocks/asistente';
import type { ChatMessage } from '@/mocks/asistente';

export default function AsistenteIA() {
  const [messages, setMessages] = useState<ChatMessage[]>(conversacionInicial);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [convActiva, setConvActiva] = useState('conv-1');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = (text?: string) => {
    const msgText = (text || input).trim();
    if (!msgText) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      text: msgText,
      time: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    let respuestaKey = 'default';
    const lower = msgText.toLowerCase();
    if (lower.includes('pago') && lower.includes('vencido')) respuestaKey = 'pagos-vencidos';
    else if (lower.includes('ingresos') || lower.includes('julio') || lower.includes('meta')) respuestaKey = 'ingresos-julio';
    else if (lower.includes('inscrip') || lower.includes('nuevo')) respuestaKey = 'nuevas-inscripciones';

    setTimeout(() => {
      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        text: respuestasIA[respuestaKey] || respuestasIA.default,
        time: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setIsTyping(false);
    }, 1800 + Math.random() * 1200);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNuevaConversacion = () => {
    setMessages(conversacionInicial);
    setInput('');
  };

  return (
    <MainLayout>
      <div className="max-w-[1440px] mx-auto">
        <div className="flex flex-col lg:flex-row gap-5 h-[calc(100vh-7rem)]">
          <div className="hidden lg:flex flex-col w-64 flex-shrink-0">
            <Card padding="none" className="flex-1 flex flex-col overflow-hidden">
              <div className="px-4 py-3 border-b border-secondary-200/70 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground-900">Conversaciones</h3>
                <Button variant="ghost" size="xs" icon="ri-add-line" onClick={handleNuevaConversacion}>
                  Nueva
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto">
                {conversaciones.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => setConvActiva(conv.id)}
                    className={`w-full text-left px-4 py-3 border-b border-secondary-100/50 transition-colors cursor-pointer ${
                      convActiva === conv.id ? 'bg-primary-50' : 'hover:bg-background-100'
                    }`}
                  >
                    <p className="text-xs font-medium text-foreground-800 truncate">{conv.titulo}</p>
                    <p className="text-2xs text-foreground-500 mt-0.5 truncate">{conv.preview}</p>
                    <p className="text-3xs text-foreground-400 mt-1">{conv.fecha}</p>
                  </button>
                ))}
              </div>
            </Card>
          </div>

          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex items-center gap-3 mb-4 flex-shrink-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                <i className="ri-robot-2-line text-white text-lg" />
              </div>
              <div>
                <h1 className="text-base font-bold text-foreground-900">Asistente IA</h1>
                <p className="text-xs text-foreground-500">Análisis inteligente de tu institución</p>
              </div>
              <Badge variant="accent" size="sm" icon="ri-sparkling-line">Beta</Badge>
            </div>

            <Card padding="none" className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                    {msg.role === 'assistant' && (
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <i className="ri-robot-2-line text-white text-xs" />
                      </div>
                    )}
                    <div className={`max-w-[80%] ${msg.role === 'user' ? 'order-first' : ''}`}>
                      <div
                        className={`rounded-xl px-4 py-3 text-sm ${
                          msg.role === 'user'
                            ? 'bg-primary-500 text-white rounded-br-md'
                            : 'bg-secondary-100/80 text-foreground-800 rounded-bl-md'
                        }`}
                      >
                        <div className="whitespace-pre-wrap [&_strong]:font-semibold [&_strong]:text-foreground-900" dangerouslySetInnerHTML={{
                          __html: msg.text
                            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                            .replace(/\|([^|]+)\|/g, (_, row) => {
                              const cells = row.split('|').map((c: string) => c.trim());
                              return `<span class="inline-flex gap-2">${cells.map((c: string) => `<span class="text-xs">${c}</span>`).join('')}</span>`;
                            })
                            .replace(/\n\n/g, '<br/><br/>')
                            .replace(/\n/g, '<br/>')
                        }} />
                      </div>
                      <p className="text-3xs text-foreground-400 mt-1 px-1">{msg.time}</p>
                    </div>
                    {msg.role === 'user' && (
                      <div className="w-7 h-7 rounded-full bg-secondary-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-2xs font-bold text-foreground-500">MA</span>
                      </div>
                    )}
                  </div>
                ))}

                {isTyping && (
                  <div className="flex gap-3">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center flex-shrink-0">
                      <i className="ri-robot-2-line text-white text-xs" />
                    </div>
                    <div className="bg-secondary-100/80 rounded-xl rounded-bl-md px-4 py-3">
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-foreground-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 rounded-full bg-foreground-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 rounded-full bg-foreground-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {messages.length <= 1 && (
                <div className="px-4 pb-3">
                  <p className="text-xs text-foreground-500 mb-2">Preguntas sugeridas:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {sugerenciasRapidas.map((sug) => (
                      <button
                        key={sug.id}
                        onClick={() => handleSend(sug.query)}
                        className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-secondary-200/70 bg-background-50 text-left hover:border-primary-300 hover:bg-primary-50/50 transition-all duration-150 cursor-pointer group"
                      >
                        <div className="w-7 h-7 flex items-center justify-center rounded-md bg-secondary-100 text-foreground-500 group-hover:text-primary-500 flex-shrink-0">
                          <i className={`${sug.icono} text-sm`} />
                        </div>
                        <span className="text-xs text-foreground-700 line-clamp-2">{sug.texto}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="px-4 py-3 border-t border-secondary-200/70 flex items-center gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Escribe tu pregunta sobre la institución..."
                  className="flex-1 rounded-lg border border-secondary-200 bg-background-50 text-sm text-foreground-900 placeholder:text-foreground-300 px-4 py-2.5 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
                />
                <Button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isTyping}
                  icon="ri-send-plane-fill"
                />
              </div>
            </Card>

            <p className="text-3xs text-foreground-400 mt-2 text-center">
              El Asistente IA puede cometer errores. Verifica la información importante.
            </p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}