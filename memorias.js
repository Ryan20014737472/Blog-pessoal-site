/*
  ARQUIVO CENTRAL DE MEMÓRIAS

  Para adicionar uma memória, copie um objeto existente e cole no lugar desejado.
  A posição do objeto nesta lista define automaticamente o número da memória.

  Formato para imagem:
  {
    "titulo": "Título",
    "texto": "Descrição",
    "corrigirOrtografia": true,
    "midia": {
      "tipo": "imagem",
      "arquivo": "assets/images/foto.jpg",
      "alt": "Descrição da foto"
    },
    "audio": {
      "arquivo": "assets/audio/musica.mp3",
      "mime": "audio/mpeg"
    }
  },
  {
    "titulo": "Título",
    "texto": "Descrição",
    "corrigirOrtografia": true,
    "midia": {
      "tipo": "video",
      "arquivo": "assets/images/foto.jpg",
      "alt": "Descrição da foto"
    },
    "audio": {
      "arquivo": "assets/audio/musica.mp3",
      "mime": "video/mp4"
    }
  },

  Para vídeo, use "tipo": "video", a pasta assets/videos e "mime": "video/mp4".
  A propriedade "audio" é opcional.

  CORREÇÃO DE PORTUGUÊS (somente para uma memória NOVA):
  1. Deixe "corrigirOrtografia": true ao criar a memória.
  2. Depois do commit, o GitHub corrige título e texto uma única vez e muda o valor para false.
  3. Para proteger uma palavra ou expressão, escreva entre chaves: {TBR}, {Leninha} ou {nome artístico}.
     O conteúdo entre chaves não será corrigido e as chaves não aparecerão no site.
  4. Nunca adicione "corrigirOrtografia": true em uma memória antiga: a automação bloqueia isso por segurança.
*/

const MEMORIAS = [
  {
    "titulo": "Pequeno Ryan",
    "texto": "Pequeno Ryan, queria poder voltar no tempo e te dar um abraço forte e dizer que você se tornou alguém brilhante e que ainda tem muito a melhorar e que aproveite cada momento da sua infância. Ame sua mãe e seus avós.",
    "midia": {
      "tipo": "imagem",
      "arquivo": "assets/images/IMG-20240628-WA0013.jpg",
      "alt": "Momento 1"
    }
  },
  {
    "titulo": "Nádia",
    "texto": "EU CONHECI A NÁDIA. CARALHO, ISSO FOI DO CARALHO. MUITO FODA. EU TE AMO, ESTADUAL.",
    "midia": {
      "tipo": "imagem",
      "arquivo": "assets/images/nadia.jpg",
      "alt": "Momento 2"
    }
  },
  {
    "titulo": "Cuecas",
    "texto": "Cuecas... mesmo sendo um grupo cheio de falsidade, se todo mundo fosse mais maduro talvez tivesse dado certo.",
    "midia": {
      "tipo": "imagem",
      "arquivo": "assets/images/cuecas.jpg",
      "alt": "Momento 3"
    }
  },
  {
    "titulo": "Danilo",
    "texto": "o que dizer sobre você mano, não tenho palavras para agradecer a você por tudo cada noite que a gente passou jogando e se divertindo, cada dia que a gente saiu para fazer merda,cada momento é único, eu te amo mano",
    "midia": {
      "tipo": "imagem",
      "arquivo": "assets/images/dan.jpg",
      "alt": "Momento 4"
    }
  },
  {
    "titulo": "gabzoka",
    "texto": "o que falar da minha irmãzoka,sem dúvidas uma das melhores pessoas que eu ja conheci cada momento louco que eu ja vivi ao seu lado não está escrito, só de lembrar já sinto gosto de corote de canelinha, te amo gabs",
    "midia": {
      "tipo": "imagem",
      "arquivo": "assets/images/gabs.jpg",
      "alt": "Momento 5"
    }
  },
  {
    "titulo": "Leninha",
    "texto": "O que falar da minha sapatona favorita? Sem dúvidas, uma das amizades mais aleatórias que eu já fiz. Você é uma pessoa pela qual eu tenho muito carinho. Todos os momentos que eu vivi com você, na FTC e na robótica, são inesquecíveis e muito preciosos para mim. Tmj CV..",
    "midia": {
      "tipo": "imagem",
      "arquivo": "assets/images/sapata.jpg",
      "alt": "Momento 6"
    }
  },
  {
    "titulo": "Casa do Léo zeni",
    "texto": "Sem dúvidas, um dos rolês mais fodas da minha vida. Cada acontecimento desse dia foi incrível: entre tapas na bunda que deslocam braços, skybundas e quedas de cabeça no concreto, tudo virou um pedaço especial dessa memória. LIFE IS FUCKING GREAT!",
    "midia": {
      "tipo": "imagem",
      "arquivo": "assets/images/robotic.jpg",
      "alt": "Momento 7"
    }
  },
  {
    "titulo": "monobola",
    "texto": "MONOBOLA!, o cara mais tranquilo que eu conheço… ou deveria dizer meio cara? Enfim, cada momento contigo — entre idiotices, pães de queijo e trabalhos da FTC e do clube maker — fez meus dias serem muito mais divertidos.",
    "midia": {
      "tipo": "imagem",
      "arquivo": "assets/images/ball.jpg",
      "alt": "Momento 8"
    }
  },
  {
    "titulo": "Parte 1 aniversário da Leninha",
    "texto": "Parte 1 do aniversário da Helena: cara, eu me diverti pra caralho na piscina, também brinquei muito no futsabão e depois comi muita pizza. Sem dúvidas, foi incrível.",
    "midia": {
      "tipo": "imagem",
      "arquivo": "assets/images/P1.jpg",
      "alt": "Momento 9"
    }
  },
  {
    "titulo": "Parte 2 aniversário da Leninha",
    "texto": "Parte 2 do aniversário da Helena: sem dúvidas, todo o resto foi incrível — a dança, o parabéns e os 10.000 sorvetes que eu comi. Tudo foi perfeito, uma festa inesquecível.",
    "midia": {
      "tipo": "imagem",
      "arquivo": "assets/images/P2.jpg",
      "alt": "Momento 10"
    }
  },
  {
    "titulo": "meus Pêsames my ring",
    "texto": "Meu anel da mão esquerda… que tristeza. Foi um ano inteiro com você ao lado, vou sentir sua falta. (Danilo, quero um novo de presente.)",
    "midia": {
      "tipo": "imagem",
      "arquivo": "assets/images/ring.jpeg",
      "alt": "Momento 11"
    }
  },
  {
    "titulo": "Primeiro Dia Da FTC",
    "texto": "O primeiro dia de FTC foi inesquecível. Eu estava com o coração quase saindo pela boca. A gente perdeu todas as partidas do dia e, admito, quase cheguei a chorar — foi realmente triste não ganhar. Mesmo assim, fiquei feliz por ter chegado até ali. Depois, tudo melhorou: a festa da amizade, a amizade inesperada com a Helena Du Nada e a aproximação com o Léo Zeni. Tudo isso fez desse dia algo eternamente gravado na minha memória.",
    "midia": {
      "tipo": "imagem",
      "arquivo": "assets/images/FTC1.jpg",
      "alt": "Momento 12"
    }
  },
  {
    "titulo": "Segundo Dia Da FTC",
    "texto": "O segundo dia de FTC foi perfeito. Nossas partidas, sem dúvidas, foram épicas. A Cyborgs escolhendo a Acrux foi um momento histórico. Aquilo selou de vez um amor interminável pela robótica. Em 2026, pretendo construir o melhor robô possível para a próxima temporada.",
    "midia": {
      "tipo": "imagem",
      "arquivo": "assets/images/FTC2.jpg",
      "alt": "Momento 13"
    }
  },
  {
    "titulo": "Pimenta...",
    "texto": "As ideias do Danilo são geniais, não é? Fui dormir na casa do cara e ele teve a brilhante ideia de comer pimenta para ficarmos acordados. Eu me arrependo profundamente de ter encorajado isso — quase morri comendo aquela pimenta. Mas, no fim das contas, virou uma memória foda. kkkkkkk",
    "midia": {
      "tipo": "video",
      "arquivo": "assets/videos/pimen.mp4",
      "mime": "video/mp4"
    }
  },
  {
    "titulo": "Natureza",
    "texto": "A natureza é cada fica cada vez mais linda, principalmente depois da robótica",
    "midia": {
      "tipo": "video",
      "arquivo": "assets/videos/natureza.mp4",
      "mime": "video/mp4"
    }
  },
  {
    "titulo": "mirazinha",
    "texto": "Que saudade do Mirazinha. O 4º ano foi maravilhoso; 2019, no geral, foi um ano muito bom. Foi quando conheci a Ana, por quem até hoje guardo um carinho especial, a Camilly e tantas outras pessoas. Infelizmente, perdi contato com a maioria, mas ainda pretendo, um dia, voltar lá para reviver — e entender melhor — essas memórias.",
    "midia": {
      "tipo": "imagem",
      "arquivo": "assets/images/2019.jpg",
      "alt": "Momento 16"
    }
  },
  {
    "titulo": "alimentação noah",
    "texto": "Meu priminho Noah é, sem dúvidas, uma fofura em pessoa — ou melhor, uma mini pessoa. Ver ele comendo é a coisa mais linda do mundo.",
    "midia": {
      "tipo": "video",
      "arquivo": "assets/videos/NN.mp4",
      "mime": "video/mp4"
    }
  },
  {
    "titulo": "Rolê na casa do Guilherme",
    "texto": "Um rolê bem divertido. Nunca imaginei que acabaria indo para a casa do Guilherme para beber com o Juliano. Foi meio curto, mas muito legal. “Tem camisinha aberta aqui, caralho.”",
    "midia": {
      "tipo": "imagem",
      "arquivo": "assets/images/maceno.jpg",
      "alt": "Momento 18"
    }
  },
  {
    "titulo": "enterrado",
    "texto": "Ser enterrado na areia é, sem dúvidas, muito legal. Tudo bem que fica difícil respirar por causa do peso da areia, mas a escultura que fizeram depois ficou perfeita. Com certeza é algo que eu faria de novo.",
    "midia": {
      "tipo": "video",
      "arquivo": "assets/videos/praia.mp4",
      "mime": "video/mp4"
    }
  },
  {
    "titulo": "escultura",
    "texto": "Essa é, sem dúvidas, a melhor escultura que eu já vi. Nenhuma outra jamais será melhor do que essa; nenhum escultor será capaz de superá-la.",
    "midia": {
      "tipo": "imagem",
      "arquivo": "assets/images/escultura.jpg",
      "alt": "Momento 20"
    }
  },
  {
    "titulo": "laboratório de física",
    "texto": "Foi minha primeira vez no laboratório de física do CEP, e foi genial. O professor sugeriu que fizéssemos um experimento de choque: todos deram as mãos, carregamos uma esfera de alumínio com energia e, quando o primeiro tocou na esfera, todos levaram um choque leve. Assustou na hora, mas foi muito divertido kkkkk.",
    "midia": {
      "tipo": "video",
      "arquivo": "assets/videos/choque.mp4",
      "mime": "video/mp4"
    }
  },
  {
    "titulo": "cabeças de pizza",
    "texto": "O Noah é lindo, né? Ele pegou a caixa de pizza e pediu para eu colocá-la na cabeça, o que acabou rendendo essa foto maravilhosa que me traz um amor inestimável.",
    "midia": {
      "tipo": "imagem",
      "arquivo": "assets/images/noah.jpg",
      "alt": "Momento 22"
    }
  },
  {
    "titulo": "passeio no estação",
    "texto": "O passeio no Estação foi a primeira vez que saí da escola por causa da robótica. Depois de irmos escutar os políticos, fomos ao Estação. Foi uma das vezes em que pude ser eu mesmo. Às vezes sinto falta disso, mas, sem dúvidas, foi um momento memorável — tudo foi perfeito, e eu amei cada segundo.",
    "midia": {
      "tipo": "imagem",
      "arquivo": "assets/images/estação.jpg",
      "alt": "Momento 23"
    }
  },
  {
    "titulo": "Sucus",
    "texto": "Definitivamente, foi uma das coisas mais simples, mas também uma das mais legais que já fiz na escola. Fizemos praticamente 10 litros de suco para tomar durante o dia. Uma dica para o futuro: “Não bebas água saborizada em excesso, caso contrário, mijarás sem parar.”",
    "midia": {
      "tipo": "imagem",
      "arquivo": "assets/images/suco.jpg",
      "alt": "Momento 24"
    }
  },
  {
    "titulo": "1° H",
    "texto": "Foi meu primeiro ano no CEP, e minha turma foi o 1º H. Sem dúvidas, foi uma experiência única. Perdi a conta de quantas memórias construí com essa turma. Tenho um carinho imenso por todos — exceto por uns aí, kkkkk. Brincadeiras à parte, 1º H eternamente.",
    "midia": {
      "tipo": "imagem",
      "arquivo": "assets/images/1H.jpg",
      "alt": "Momento 25"
    }
  },
  {
    "titulo": "Cícero",
    "texto": "Nesta foto vemos a pessoa com mais aura do mundo: Cícero Bittencourt. Sua presença é esmagadora; jamais veremos um ser assim novamente. Tive a sorte de ter a honra de tirar uma foto com ele.",
    "midia": {
      "tipo": "imagem",
      "arquivo": "assets/images/cicero.jpg",
      "alt": "Momento 26"
    }
  },
  {
    "titulo": "X-Drive",
    "texto": "O X-Drive foi meu primeiro 3D mais complexo e, consequentemente, o melhor. Cheguei a passar uma madrugada inteira mexendo nele e tenho que admitir: ficou perfeito. Pretendo evoluir cada vez mais.",
    "midia": {
      "tipo": "imagem",
      "arquivo": "assets/images/3D.png",
      "alt": "Momento 27"
    }
  },
  {
    "titulo": "Robótica no Muller",
    "texto": "Esse dia foi muito foda. A gente tinha acabado de voltar do SESI e resolvemos ir ao Müller. Foi massa: fomos na atração das Guerreiras do K-pop e fizemos um vídeo 360°. Amei cada momento.",
    "midia": {
      "tipo": "imagem",
      "arquivo": "assets/images/Muller.jpg",
      "alt": "Momento 28"
    }
  },
  {
    "titulo": "Rolê com Danilo e Magno Parte 1",
    "texto": "O que poderia dar errado comigo, o Danilo e o Magno saindo para se divertir? Bom, não deu nada errado — mas tinha tudo para dar. Compramos vodka, energético e salgadinhos para comer; foi um começo bem interessante para o rolê.",
    "midia": {
      "tipo": "imagem",
      "arquivo": "assets/images/dr.jpg",
      "alt": "Momento 29"
    }
  },
  {
    "titulo": "Rolê com Danilo e Magno Parte 2",
    "texto": "Depois de beber um pouco, resolvemos comer algo. Fomos ao mercado e compramos pizzas de forno para fazer na casa do Danilo. Ficaram gostosas — embora ele tenha tostado uma de queijo, mas ainda assim deu para aproveitar. Depois jogamos videogame até irmos embora. Temos que repetir logo.",
    "midia": {
      "tipo": "video",
      "arquivo": "assets/videos/dr1.mp4",
      "mime": "video/mp4"
    }
  },
  {
    "titulo": "Casa do Danilo",
    "texto": "Mais um dos muitos rolês meus e do Danilo. Fui dormir lá, e os pais dele pediram pizza e uma Coca-Cola. Ficamos até de madrugada jogando — definitivamente foi um rolê memorável.",
    "midia": {
      "tipo": "imagem",
      "arquivo": "assets/images/noite.jpg",
      "alt": "Momento 31"
    }
  },
  {
    "titulo": "Kelly",
    "texto": "Por onde eu começo a falar de você, Kelly? Você é definitivamente uma das mulheres mais amorosas que conheço, um doce de pessoa — meio lerda às vezes, mas sempre com uma personalidade cativante. Pretendo te ver mais vezes, porque gosto muito de você.",
    "midia": {
      "tipo": "imagem",
      "arquivo": "assets/images/kelly.jpg",
      "alt": "Momento 32"
    }
  },
  {
    "titulo": "passeio na chuva",
    "texto": "Esse foi definitivamente um dos passeios mais molhados que já tive (essa piada foi horrível). Eu e o Danilo saímos para andar e resolvemos jogar lixo em um córrego perto da casa dela. Depois, uma velha xingou a gente, dizendo: “esse é o futuro do Brasil”. Em seguida começou a chover — definitivamente foi muito foda. Quem sabe a gente repete isso algum dia, kkkk.",
    "midia": {
      "tipo": "imagem",
      "arquivo": "assets/images/chovechuvvvaaa.jpg",
      "alt": "Momentos 33"
    }
  },
  {
    "titulo": "Jotinha",
    "texto": "Jotinhaaaaa, meu integrante favorito da robótica! Sem dúvidas, você dá um peso a mais para a equipe. Você é muito foda; sempre que quer ajudar, se esforça ao máximo. Tmj, Jotinha.",
    "midia": {
      "tipo": "imagem",
      "arquivo": "assets/images/JPPP.jpg",
      "alt": "Momento 34"
    }
  },
  {
    "titulo": "Cafezin de tarde na casa do Danilo parte 1",
    "texto": "De repente, estou bebendo café com leite na casa do Danilo depois da escola. Nossos rolês ficam cada vez mais diferentes, kkkk.",
    "midia": {
      "tipo": "imagem",
      "arquivo": "assets/images/cafe1.jpg",
      "alt": "Momento 35"
    }
  },
  {
    "titulo": "Cafezin de tarde na casa do Danilo parte 2",
    "texto": "Definitivamente, café com GTA 5 é uma combinação muito boa. Temos que fazer isso de novo algum dia.",
    "midia": {
      "tipo": "imagem",
      "arquivo": "assets/images/cafe2.jpg",
      "alt": "Cafezin de tarde na casa do Danilo parte 2"
    },
    "audio": {
      "arquivo": "assets/audio/GTA.mp3",
      "mime": "audio/mpeg"
    }
  },
  {
    "titulo": "Visita da robótica ao centro da educação",
    "texto": "Cara, essa visita foi um caos. O robô não estava funcionando, tinha gente chorando e… tinha uma vaca. Espera, tinha chifres, mas definitivamente não era uma vaca. Enfim, apesar de tudo, essa foto ficou muito boa. Talvez possamos repetir isso de uma maneira mais organizada.",
    "midia": {
      "tipo": "imagem",
      "arquivo": "assets/images/família.jpg",
      "alt": "Visita da robótica ao centro da educação"
    },
    "audio": {
      "arquivo": "assets/audio/family.mp3",
      "mime": "audio/mpeg"
    }
  },
  {
    "titulo": "Monster branco",
    "texto": "nada melhor que um Monster gelado as 6:47 da manhã antes do colégio",
    "midia": {
      "tipo": "imagem",
      "arquivo": "assets/images/Monster.jpeg",
      "alt": "Monster branco"
    },
    "audio": {
      "arquivo": "assets/audio/monster.mp3",
      "mime": "audio/mpeg"
    }
  },
  {
    "titulo": "Aura pura🔥",
    "texto": "três pilares farmando muita aura, essa foto tem que ser eternizada",
    "midia": {
      "tipo": "imagem",
      "arquivo": "assets/images/aura.jpg",
      "alt": "Aura pura🔥"
    },
    "audio": {
      "arquivo": "assets/audio/sigma.mp3",
      "mime": "audio/mpeg"
    }
  },
  {
    "titulo": "Betinha empata aura",
    "texto": "betinha tentando atrapalhar a farm de aura infinita.",
    "midia": {
      "tipo": "imagem",
      "arquivo": "assets/images/aura1.jpg",
      "alt": "betinha"
    },
    "audio": {
      "arquivo": "assets/audio/aura67.mp3",
      "mime": "audio/mpeg"
    }
  },
  {
    "titulo": "D.ribeiro",
    "texto": "minha primeira amiga da robótica, sem dúvidas foi uma amizade com altos e baixos, mas acima de tudo a gente sempre se entendeu no final, seu jeito divertida e também esquisita é definitivamente encantador.",
    "midia": {
      "tipo": "imagem",
      "arquivo": "assets/images/danijapa.jpg",
      "alt": "D.ribeiro"
    },
    "audio": {
      "arquivo": "assets/audio/japinha.mp3",
      "mime": "audio/mpeg"
    }
  },
  {
    "titulo": "stitch",
    "texto": "apenas homens felizes com um stitch little",
    "midia": {
      "tipo": "imagem",
      "arquivo": "assets/images/switch.jpg",
      "alt": "stitch"
    },
    "audio": {
      "arquivo": "assets/audio/switch.mp3",
      "mime": "audio/mpeg"
    }
  },
  {
    "titulo": "divertidamente real Life",
    "texto": "definitivamente cada um de nós representa sua emoção com perfeição, só faltou meu casaco ser rosa",
    "midia": {
      "tipo": "imagem",
      "arquivo": "assets/images/divertidamente.jpg",
      "alt": "divertidamente real Life"
    },
    "audio": {
      "arquivo": "assets/audio/divertidamente.mp3",
      "mime": "audio/mpeg"
    }
  },
  {
    "titulo": "2M em um dia qualquer",
    "texto": "> A Raphaela tentou gravar um vlog, e até que ficou fofinho, mesmo com a maioria não levando a sério. Esse é um pouquinho da turma do 2º M — ou, pelo menos, da parte boa.",
    "midia": {
      "tipo": "video",
      "arquivo": "assets/videos/2M.mp4",
      "mime": "video/mp4"
    }
  },
  {
    "titulo": "O começo",
    "texto": "Esse foi o começo de tudo. Eu e o Danilo tínhamos acabado de virar amigos. Já éramos idiotas, mas ainda não éramos tão próximos quanto somos hoje. Só de pensar que tudo começou por causa do Brawl Stars é realmente impressionante. Tmj, mano.",
    "midia": {
      "tipo": "imagem",
      "arquivo": "assets/images/1vez.jpg",
      "alt": "O começo"
    },
    "audio": {
      "arquivo": "assets/audio/1vez.mp3",
      "mime": "audio/mpeg"
    }
  },
  {
    "titulo": "icezin",
    "texto": "Nada como tomar um ice no calor com o Danilo, nossos rolês estão ficando bem diversificados",
    "midia": {
      "tipo": "imagem",
      "arquivo": "assets/images/ice.jpg",
      "alt": "icezin"
    },
    "audio": {
      "arquivo": "assets/audio/ice.mp3",
      "mime": "audio/mpeg"
    }
  },
  {
    "titulo": "Uma aula surpresa",
    "texto": "Cara, dar uma aula foi, sem dúvidas, uma experiência inovadora. Eu não fazia a mínima ideia de como conduzir a aula, então tive que improvisar. No fim, isso só me mostrou que sou capaz e que posso ir além. Não é à toa que, agora, meu projeto de aula está na FECCI, uma enorme feira de ciências. Vou fazer de tudo para trazer esse prêmio.",
    "midia": {
      "tipo": "imagem",
      "arquivo": "assets/images/aula.jpeg",
      "alt": "Uma aula surpresa"
    },
    "audio": {
      "arquivo": "assets/audio/aula.mp3",
      "mime": "audio/mpeg"
    }
  },
  {
    "titulo": "criado da TBR",
    "texto": "sintam inveja tenho foto com o criado do torneio brasil de robótica",
    "midia": {
      "tipo": "imagem",
      "arquivo": "assets/images/Newton.jpg",
      "alt": "criado da TBR"
    },
    "audio": {
      "arquivo": "assets/audio/newton.mp3",
      "mime": "audio/mpeg"
    }
  },
  {
    "titulo": "67 AURA",
    "texto": "bandido quer 67 resenha, bandido quer 67 resenha,bandido quer 67 resenha,bandido quer 67 resenha,bandido quer 67 resenha,bandido quer 67 resenha,bandido quer 67 resenhabandido quer 67 resenha,bandido quer 67 resenha,bandido quer 67 resenha",
    "midia": {
      "tipo": "video",
      "arquivo": "assets/videos/six,7.mp4",
      "mime": "video/mp4"
    }
  },
  {
    "titulo": "campeonato de farmar aura",
    "texto": "o bandido mais aurudo ganhou...... EU aura 67",
    "midia": {
      "tipo": "video",
      "arquivo": "assets/videos/comp67.mp4",
      "mime": "video/mp4"
    }
  },
  {
    "titulo": "Visita do criador da TBR no Cep",
    "texto": "Esse dia foi muito legal. Conhecemos o Newton, criador da TBR. Ele apareceu meio do nada e acabou sendo um cara muito gente boa. Foi ele quem nos possibilitou participar da TBR; afinal, sem ele, a TBR não existiria. (Essa vai ser a única vez que veremos o Léo Zeni de óculos ☠️.)",
    "midia": {
      "tipo": "imagem",
      "arquivo": "assets/images/Encontrotbr.jpg",
      "alt": "newton na robotica"
    },
    "audio": {
      "arquivo": "assets/audio/elite.mp3",
      "mime": "audio/mpeg"
    }
  },
  {
    "titulo": "almoço com leléo e leninha",
    "texto": "Mais um dos milhares de almoços meus no Café da 19, mas dessa vez com uma lésbica e um autista.",
    "midia": {
      "tipo": "imagem",
      "arquivo": "assets/images/LHR.jpg",
      "alt": "almoço LHR"
    },
    "audio": {
      "arquivo": "assets/audio/pãodequeijo.mp3",
      "mime": "audio/mpeg"
    }
  },
  {
    "titulo": "Passeio no centro com leléo e leninha",
    "texto": "Olha, esse passeio definitivamente não estava previsto. Quando estávamos indo embora, a Helena soltou: “Vamos ver minha namorada”. Ela fez a gente andar pelo centro, passando por lugares que definitivamente pareciam meio perigosos, para, no final, descobrirmos que a namorada dela já tinha ido embora. Pelo menos os sedentários da robótica fizeram um pouco de exercício.",
    "midia": {
      "tipo": "video",
      "arquivo": "assets/videos/passeios.mp4",
      "mime": "video/mp4"
    }
  },
  {
    "titulo": "pós instituto da educação",
    "texto": "Esse vídeo é da robótica voltando do Instituto de Educação depois da palestra. Foi bem resenha, e o Raphael imitando o Jobas foi definitivamente genial.",
    "midia": {
      "tipo": "video",
      "arquivo": "assets/videos/voltandoX.mp4",
      "mime": "video/mp4"
    }
  },
  {
    "titulo": "Baly.",
    "texto": "acho que bebemos tadala demais-....quero dizer energetico",
    "midia": {
      "tipo": "video",
      "arquivo": "assets/videos/tadala.mp4",
      "mime": "video/mp4"
    }
  },
  {
    "titulo": "resenha67",
    "texto": "muita aura para ser descrita em palavras",
    "midia": {
      "tipo": "video",
      "arquivo": "assets/videos/resenhax.mp4",
      "mime": "video/mp4"
    }
  },
  {
    "titulo": "Cep no guaíra",
    "texto": "O dia começou até que comum. O CEP fez uma visita ao Teatro Guaíra. O Sebastian pegou um suco e duas pipocas de micro-ondas, e nós corremos para fazer as pipocas lá embaixo, no micro-ondas do CEP. Depois, tivemos que correr de volta para a nossa turma e, por sorte, conseguimos chegar a tempo. Mas, no final, a moça do Guaíra roubou minha pipoca.",
    "midia": {
      "tipo": "imagem",
      "arquivo": "assets/images/pipoca.jpg",
      "alt": "passafome"
    },
    "audio": {
      "arquivo": "assets/audio/pipoca.mp3",
      "mime": "audio/mpeg"
    }
  },
  {
    "titulo": "chutar lesbicas",
    "texto": "galera Recomendo é muito relaxante",
    "midia": {
      "tipo": "imagem",
      "arquivo": "assets/images/pisar.jpg",
      "alt": "pizzzzzzar"
    },
    "audio": {
      "arquivo": "assets/audio/lesbicas.mp3",
      "mime": "audio/mpeg"
    }
  },
  {
    "titulo": "troféus da OBR",
    "texto": "Meus pequenos bebês, que consegui fazer com muito suor e amor. Vou sentir falta de vocês eternamente.",
    "midia": {
      "tipo": "imagem",
      "arquivo": "assets/images/trofeus.jpg",
      "alt": "bbs"
    },
    "audio": {
      "arquivo": "assets/audio/trophy.mp3",
      "mime": "audio/mpeg"
    }
  },
  {
    "titulo": "caixas Acrux",
    "texto": "mais uma das minhas criações, elas foram entregues para os juízes na TBR, ou seja a Acrux só ganhou por causa de mim (a montagem tava errada mas faz parte)",
    "midia": {
      "tipo": "imagem",
      "arquivo": "assets/images/caixas.jpeg",
      "alt": "box.goodgood"
    },
    "audio": {
      "arquivo": "assets/audio/bigbox.mp3",
      "mime": "audio/mpeg"
    }
  },
  {
    "titulo": "O Carlos",
    "texto": "Esse é o carlos a porra do deus do CAD, This is a made in heaven.",
    "midia": {
      "tipo": "imagem",
      "arquivo": "assets/images/carlos.jpg",
      "alt": "the god"
    },
    "audio": {
      "arquivo": "assets/audio/carlos.mp3",
      "mime": "audio/mpeg"
    }
    },

  {
    "titulo": "TBR",
    "texto": "O momento que eu nunca pensei que chegaria: a TBR. Definitivamente, foi uma das melhores competições da minha vida. Nunca vi a Acrux tão unida quanto naquele dia. Cada detalhe, cada esforço e cada momento foram necessários para nos trazer até aquele momento: o primeiro lugar no Torneio Brasil de Robótica.",
    "midia": {
      "tipo": "imagem",
      "arquivo": "assets/images/vitoria.jpg",
      "alt": "victory"
    },
    "audio": {
      "arquivo": "assets/audio/vitoria.mp3",
      "mime": "audio/mpeg"
    }
  },
 {
    "titulo": "ROBOCEP comemorando",
    "texto": "essa foto mostra toda a equipe ROBOCEP comemorando após ficar em 1° lugar nas duas categorias da TBR",
    "corrigirOrtografia": false,
    "midia": {
      "tipo": "imagem",
      "arquivo": "assets/images/equipe inteira.jpg",
      "alt": "equiper"
    },
    "audio": {
      "arquivo": "assets/audio/winni.mp3",
      "mime": "audio/mpeg"
    }
  }, 
  
  {
    "titulo": "Uber para habibs",
    "texto": "Eu, Leninha e Leleo indo pro Habibs de Uber pós vitória TBR.",
    "midia": {
      "tipo": "video",
      "arquivo": "assets/videos/caminho.mp4",
      "mime": "video/mp4"
    }
  },
   {
    "titulo": "comemoração vitoria da TBR",
    "texto": "Nós fomos ao Habib’s depois de vencer o campeonato da TBR. Definitivamente, foi muito divertido! Todos estavam cansados e com fome também. (O meu amor ali no canto 😍)",
    "midia": {
      "tipo": "imagem",
      "arquivo": "assets/images/habbis.jpg",
      "alt": "esfira"
    },
    "audio": {
      "arquivo": "assets/audio/victory.mp3",
      "mime": "audio/mpeg"
    }
  },
  {
    "titulo": "Minha equipe H",
    "texto": "Meu pequeno time no Hackathon, tenho que admitir que não tava confiante, no começo eu não conhecia ninguém, e também não estava confiante sobre minhas habilidades, mas depois disso, foi diversão e resenha, cada segundo foi mais legal que o outro me diverti sem parar e quem sabe um dia nós podemos repetir",
    "corrigirOrtografia": false,
    "midia": {
      "tipo": "imagem",
      "arquivo": "assets/images/hack2.jpg",
      "alt": "hhhhh"
    },
    "audio": {
      "arquivo": "assets/audio/hack.mp3",
      "mime": "audio/mpeg"
    }
  },
  {
    "titulo": "Hackathon",
    "texto": "Minha grandiosa participação no Hackathon. O começo foi um caos: tivemos que nos organizar em áreas, e eu e o Vinícius entramos de intrusos em um time qualquer. Por sorte, conseguimos nos sair bem. Resolvemos desafios, comemos pizza, tomamos café, eu me queimei com cola quente e fiquei 20 horas sem dormir. Nunca fiquei tão cansado na vida, mas, sem dúvidas, foi uma experiência que quero repetir.",
    "midia": {
      "tipo": "imagem",
      "arquivo": "assets/images/haka.jpg",
      "alt": "Hackathon"
    },
    "audio": {
      "arquivo": "assets/audio/Madagascar.mp3",
      "mime": "audio/mpeg"
    }
  },
  {
    "titulo": "Banjo no cep",
    "texto": "O Filho da puta do Roqueiro trouxe um banjo",
    "midia": {
      "tipo": "imagem",
      "arquivo": "assets/images/estranheza.jpg",
      "alt": "banjo"
    },
    "audio": {
      "arquivo": "assets/audio/bebados.mp3",
      "mime": "audio/mpeg"
    }
  },
    {
  "titulo": "Sertanejo da Acrux",
  "texto": "nada como cantar sertanejo sofrência com a Acrux",
  "corrigirOrtografia": false,
  "midia": {
    "tipo": "video",
    "arquivo": "assets/videos/sertanejo.mp4",
    "alt": "voltaaaaa"
  }
    },
  {
  "titulo": "Mãozinha da Acrux",
  "texto": "Dança da mãozinha com a Acrux (sou um ótimo cantor)",
  "corrigirOrtografia": false,
  "midia": {
    "tipo": "video",
    "arquivo": "assets/videos/sertanejo2.mp4",
    "alt": "mãozinha"
  }
  },
  {
  "titulo": "Cinema na robótica",
  "texto": "Foi um dia bem tranquilo na robótica. Eu, Brubru, Leninha e Leleo estávamos assistindo a Chainsaw Man.",
  "corrigirOrtografia": false,
  "midia": {
    "tipo": "imagem",
    "arquivo": "assets/images/cinemarob.jpg",
    "alt": "Foto no cinema"
  },
  "audio": {
    "arquivo": "assets/audio/cinemax.mp3",
    "mime": "audio/mpeg"
  }
  },
  {
    "titulo": "{nono}",
    "texto": "esse menino ta crescendo rapido antes ele era um {pitico} agora está enorme",
    "corrigirOrtografia": true,
    "midia": {
      "tipo": "imagem",
      "arquivo": "assets/images/nono.jpg",
      "alt": "Nono"
    },
    "audio": {
      "arquivo": "assets/audio/nono.aac",
      "mime": "audio/aac"
    }
  }
];

if (typeof window !== "undefined") {
  window.BLOG_MEMORIES = MEMORIAS;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = MEMORIAS;
}

