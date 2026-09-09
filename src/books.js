export const books = [
  { id: 'secret', title: 'The Secret History', author: 'Donna Tartt', rating: 5, color: '#8e6c43', url: '29044.The_Secret_History' },
  { id: 'wisdom', title: 'The Wisdom of Insecurity', author: 'Alan Watts', rating: 5, color: '#95723f', url: '551520.The_Wisdom_of_Insecurity' },
  { id: 'power', title: 'The Path to Power', author: 'Robert A. Caro', rating: 5, color: '#ae9774', url: '86524.The_Path_to_Power' },
  { id: 'testing', title: 'Unit Testing', author: 'Vladimir Khorikov', rating: 5, color: '#ae763e', url: '48927138-unit-testing' },
  { id: 'eden', title: 'East of Eden', author: 'John Steinbeck', rating: null, color: '#9b9f80', url: '40607194-east-of-eden' },
  { id: 'disgrace', title: 'Disgrace', author: 'J. M. Coetzee', rating: 5, color: '#877052', url: '6192.Disgrace' },
  { id: 'hyperion', title: 'Hyperion', author: 'Dan Simmons', rating: 4, color: '#6a86a4', url: '77566.Hyperion' },
  { id: 'demon', title: 'Demon Copperhead', author: 'Barbara Kingsolver', rating: null, color: '#b57340', url: '60384452-demon-copperhead' },
];
export function bookAnchor(index, mobile) {
  return {x:(mobile ? .479 : .505)+index*(mobile ? .032 : .037), y:mobile ? .697 : .625, height:mobile ? .102 : .132};
}
