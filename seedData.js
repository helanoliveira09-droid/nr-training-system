const DEFAULT_NR_TYPES = [
  { code: 'NR-01', name: 'Disposições Gerais e Gerenciamento de Riscos', conteudo: 'Diretrizes de gestão de riscos ocupacionais (GRO), PGR, direitos e deveres, atos inseguros e condições de risco.', instrutores: [] },
  { code: 'NR-05', name: 'CIPA - Comissão Interna de Prevenção de Acidentes', conteudo: 'Constituição e atribuições da CIPA, identificação de riscos, mapa de risco, prevenção de acidentes.', instrutores: [] },
  { code: 'NR-06', name: 'Equipamento de Proteção Individual (EPI)', conteudo: 'Tipos de EPI, seleção, uso correto, guarda, higienização, responsabilidades do empregador e do empregado.', instrutores: [] },
  { code: 'NR-09', name: 'Avaliação e Controle das Exposições Ocupacionais', conteudo: 'Reconhecimento, avaliação e controle de agentes físicos, químicos e biológicos no ambiente de trabalho.', instrutores: [] },
  { code: 'NR-10', name: 'Segurança em Instalações e Serviços em Eletricidade', conteudo: 'Riscos elétricos, medidas de controle, procedimentos de segurança, NR-10 básico e complementar.', instrutores: [] },
  { code: 'NR-11', name: 'Transporte, Movimentação e Armazenagem de Materiais', conteudo: 'Movimentação segura de cargas, uso de empilhadeiras, transporte manual e mecanizado de materiais.', instrutores: [] },
  { code: 'NR-12', name: 'Segurança no Trabalho em Máquinas e Equipamentos', conteudo: 'Dispositivos de segurança em máquinas, procedimentos de bloqueio e travamento (LOTO), riscos mecânicos.', instrutores: [] },
  { code: 'NR-17', name: 'Ergonomia', conteudo: 'Princípios ergonômicos aplicados ao trabalho, postura, mobiliário, organização do trabalho.', instrutores: [] },
  { code: 'NR-18', name: 'Segurança na Indústria da Construção', conteudo: 'Condições de segurança na construção civil, PCMAT, andaimes, escavações, proteção coletiva.', instrutores: [] },
  { code: 'NR-20', name: 'Inflamáveis e Combustíveis', conteudo: 'Classificação de líquidos e gases inflamáveis, armazenamento, transporte e manuseio seguro.', instrutores: [] },
  { code: 'NR-23', name: 'Proteção Contra Incêndios', conteudo: 'Prevenção e combate a incêndios, saídas de emergência, uso de extintores, rotas de fuga.', instrutores: [] },
  { code: 'NR-33', name: 'Espaços Confinados', conteudo: 'Identificação, avaliação e controle de riscos em espaços confinados, permissão de entrada e trabalho.', instrutores: [] },
  { code: 'NR-34', name: 'Construção, Reparação e Desmonte Naval', conteudo: 'Segurança na construção, reparação e desmonte naval, riscos específicos do setor naval.', instrutores: [] },
  { code: 'NR-35', name: 'Trabalho em Altura', conteudo: 'Planejamento, organização e execução do trabalho em altura, uso de sistemas de ancoragem e EPI.', instrutores: [] }
];

const DEFAULT_SETORES = [
  { nome: 'Manutenção', responsavel: 'A definir' },
  { nome: 'Obras / Construção Civil', responsavel: 'A definir' },
  { nome: 'Administrativo', responsavel: 'A definir' }
];

module.exports = { DEFAULT_NR_TYPES, DEFAULT_SETORES };
