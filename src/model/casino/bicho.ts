export const BichoGroupMap = [
  "-",
  "D'Arc",
  "Sharkhai",
  "Adão",
  "Isqueiro",
  "K-Torze",
  "Rozeta",
  "Moai",
  "Boladinho",
  "Stonehenge",
  "Galena",
  "Redrum",
  "ThunderVolt",
  "ThunderWaze",
  "Tracer",
  "Ratnik",
  "Time Olympus",
  "Apolkalipse",
  "Ônix",
  "Leprechaun",
  "Pepita",
  "Spintronic",
  "Pipolka",
  "Cachorro Louco",
  "USP Recicla",
  "Jardineiro",
];

export enum BichoBetType {
  GROUP = "grupo",
  DEZENA = "dezena",
  CENTENA = "centena",
  MILHAR = "milhar",
}

export type BichoBet = {
  amount: number;
  bet: number;
  type: BichoBetType;
  cerca: boolean;
};
