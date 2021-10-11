import { SlashCommandSubcommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import { Service } from "typedi";

import { ISubCommand } from "../../CommandManager";
import { CasinoBichoSubCommandToken } from "./bicho";

@Service({ id: CasinoBichoSubCommandToken, multiple: true })
export class CasinoBichoHelpCmd implements ISubCommand {
  readonly name: string = "help";
  readonly description: string = 'Help for "bicho" game';

  static cartela = "https://cdn.discordapp.com/attachments/895460219725942884/896872887263313920/cartela2.png";
  static helpText = [
    `Olá! Boas vindas ao Jogo de Robôs do ThunderCasino. O formato do jogo do bicho, porém com os projetos da Thunder.

No Jogo de Robôs, cada Robô possui 4 dezenas atrelado a ele (vide cartela). Diariamente há 5 sorteios diferentes, cada sorteio irá tirar 2 dezenas das 100, formando 5 milhares, com cada dezena sendo retirada do pool (o sorteio \`1111\` é impossivel). Você irá apostar em diferentes resultados desses sorteios. Por exemplo, imagine que os resultados de um dia de sorteio foram em ordem:

\`01\` \`66\` (Série 1 - Cabeça)
\`05\` \`64\` (Série 2)
\`98\` \`34\` (Série 3)
\`27\` \`45\` (Série 4)
\`88\` \`70\` (Série 5)

Há dois tipos diferentes de aposta, a Cabeça (Normal) e a Cerca. As apostas do tipo Cabeça consideram apenas o primeiro sorteio, ou seja, apenas \`0166\`. As apostas de Cerca irão usar todos os 5 sorteios, porém irão valer 5x menos.
Há diferentes modalidades de apostas com esses valores, com as mais arriscadas tendo uma recompensa bem maior. As modalidades são:

  - **Grupo**: Você aposta em um Robô, e com isso, nas 4 dezenas atreladas a ele. Caso qualquer uma dessas dezenas seja a dezena final, você ganha. No exemplo, você ganha a cabeça se apostou no Apolkalipse (Grupo \`17\`, dezenas \`65\`, \`66\`, \`67\`, \`68\`). Você ganha a cerca caso tenha apostado no Apolkalipse (17), Olympus (16), Stonehenge (9), ThunderVolt (12) ou Ônix (18).
  - **Dezena**: Você aposta em uma única dezena como o valor final do milhar do sorteio. No exemplo, você ganha a cabeça se apostar apenas em \`66\`, e ganha a cerca se apostar em qualquer um dos últimos dois números de cada sorteio (\`66\`, \`64\`, \`34\`, \`45\` ou \`70\`).
  - **Centena**: Você aposta em uma centena como o valor final do milhar do sorteio. Por exemplo, caso você aposte em  \`166\`, você teria ganhado na cabeça.
  - **Milhar**: Você aposta qual será o número que será sorteado.`,

    `Você pode fazer apenas uma única aposta por dia. As apostas são feitas pelo comando \`/casino bicho bet\`:
Ao rodar o comando terá os seguintes parâmetros:
  - \`type\`: O tipo de aposta, escolha uma das opções listadas.
  - \`amount\`: A quantidade de T฿ que você quer apostar.
  - \`bet\`: O número que você quer apostar
    - 1 a 25 para apostas do tipo Grupo
    - 0 a 99 para apostas do tipo Dezena
    - 0 a 999 para apostas do tipo Centena
    - 0 a 9999 para apostas do tipo Milhar
  - \`cerca\`: Coloque como "True" se quiser apostar na cerca (opcional, por padrão é falso)

O resultado dos sorteios é liberado todo dia meia noite.
No mais, é isso, respeitem-se e sem tretas. Em caso de dúvidas fale com o @Nery ou o @Aruqui.

Bons jogos e boa sorte!`,
  ];

  async create(): Promise<SlashCommandSubcommandBuilder> {
    return new SlashCommandSubcommandBuilder().setName(this.name).setDescription(this.description);
  }

  async run(interaction: CommandInteraction): Promise<void> {
    await interaction.reply(CasinoBichoHelpCmd.cartela);
    await interaction.followUp(CasinoBichoHelpCmd.helpText[0]);
    await interaction.followUp(CasinoBichoHelpCmd.helpText[1]);
  }
}
