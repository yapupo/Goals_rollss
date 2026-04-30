const greetings = [
  "Oi, {name}! ☁️ Pronta pra um dia produtivo?",
  "Olá, {name}~ vamos conquistar suas metas juntinhos?",
  "Bom te ver, {name}! Eu separei uma cestinha pra suas conquistas!",
  "Hi {name}! Hoje a gente vai com calminha e foco, tá?",
];

const empty = [
  "Sua lista tá vazinha! Que tal adicionar uma metinha pra começar?",
  "Nenhuma tarefa por aqui ainda~ Cinnamoroll tá esperando ✨",
  "Hmm, parece que tá tudo limpinho. Vamos planejar algo fofo?",
];

const someActive = [
  "Você consegue, {name}! Vai uma de cada vez 💙",
  "Olha quantas metinhas! Vamos riscando devagar~",
  "Respira fundo. Cinnamoroll tá aqui, juntinho!",
  "Cada tarefa concluída é um docinho na sua cestinha 🍬",
];

const allDone = [
  "Uau, {name}! Você concluiu tudo! Merece um abraço fofo 🤍",
  "Tudo feito! Cinnamoroll tá orgulhoso de você ☁️✨",
  "Lista limpa! Hora de relaxar com um chocolate quentinho.",
];

const pick = (arr: string[], name: string) =>
  arr[Math.floor(Math.random() * arr.length)].replaceAll("{name}", name || "amigo(a)");

export function cinnamonQuote(name: string, activeCount: number, totalCount: number) {
  if (totalCount === 0) return pick(empty, name);
  if (activeCount === 0) return pick(allDone, name);
  return pick(someActive, name);
}

export function cinnamonGreeting(name: string) {
  return pick(greetings, name);
}
