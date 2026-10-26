/**
 * Spotle Movie Database & Engine for ReelQuest
 * 
 * Contains celebrated and iconic cinema masterpieces across all major genres,
 * directors, and eras for the daily Spotle mystery guessing game.
 */

export const SPOTLE_MOVIES = [
  {
    id: "tt1375666",
    title: "Inception",
    year: 2010,
    director: "Christopher Nolan",
    genres: ["Action", "Sci-Fi", "Adventure"],
    cast: ["Leonardo DiCaprio", "Joseph Gordon-Levitt", "Elliot Page", "Tom Hardy", "Cillian Murphy"],
    rating: 8.8,
    runtime: 148,
    posterPath: "/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg",
    tagline: "Your mind is the scene of the crime.",
    overview: "A thief who steals corporate secrets through dream-sharing technology is given the inverse task of planting an idea into the mind of a CEO."
  },
  {
    id: "tt0468569",
    title: "The Dark Knight",
    year: 2008,
    director: "Christopher Nolan",
    genres: ["Action", "Crime", "Drama", "Thriller"],
    cast: ["Christian Bale", "Heath Ledger", "Aaron Eckhart", "Michael Caine", "Gary Oldman"],
    rating: 9.0,
    runtime: 152,
    posterPath: "/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
    tagline: "Why so serious?",
    overview: "When the menace known as the Joker wreaks havoc on Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice."
  },
  {
    id: "tt0110912",
    title: "Pulp Fiction",
    year: 1994,
    director: "Quentin Tarantino",
    genres: ["Crime", "Drama", "Thriller"],
    cast: ["John Travolta", "Samuel L. Jackson", "Uma Thurman", "Bruce Willis", "Ving Rhames"],
    rating: 8.9,
    runtime: 154,
    posterPath: "/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg",
    tagline: "Just because you are a character doesn't mean you have character.",
    overview: "The lives of two mob hitmen, a boxer, a gangster and his wife, and a pair of diner bandits intertwine in four tales of violence and redemption."
  },
  {
    id: "tt0137523",
    title: "Fight Club",
    year: 1999,
    director: "David Fincher",
    genres: ["Drama", "Thriller"],
    cast: ["Brad Pitt", "Edward Norton", "Helena Bonham Carter", "Meat Loaf", "Jared Leto"],
    rating: 8.8,
    runtime: 139,
    posterPath: "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
    tagline: "Mischief. Mayhem. Soap.",
    overview: "An insomniac office worker and a devil-may-care soap maker form an underground fight club that evolves into much more."
  },
  {
    id: "tt0109830",
    title: "Forrest Gump",
    year: 1994,
    director: "Robert Zemeckis",
    genres: ["Drama", "Romance", "Comedy"],
    cast: ["Tom Hanks", "Robin Wright", "Gary Sinise", "Sally Field", "Mykelti Williamson"],
    rating: 8.8,
    runtime: 142,
    posterPath: "/arw2VCBveWOVZr6pxd9XTd1TdQa.jpg",
    tagline: "Life is like a box of chocolates.",
    overview: "The history of the United States from the 1950s to the '70s unfolds from the perspective of an Alabama man with an IQ of 75."
  },
  {
    id: "tt0816692",
    title: "Interstellar",
    year: 2014,
    director: "Christopher Nolan",
    genres: ["Sci-Fi", "Drama", "Adventure"],
    cast: ["Matthew McConaughey", "Anne Hathaway", "Jessica Chastain", "Michael Caine", "Matt Damon"],
    rating: 8.7,
    runtime: 169,
    posterPath: "/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
    tagline: "Mankind was born on Earth. It was never meant to die here.",
    overview: "When Earth becomes uninhabitable in the future, a farmer and ex-NASA pilot is tasked to pilot a spacecraft along with a team of researchers to find a new planet for humans."
  },
  {
    id: "tt0133093",
    title: "The Matrix",
    year: 1999,
    director: "Lana Wachowski",
    genres: ["Action", "Sci-Fi"],
    cast: ["Keanu Reeves", "Laurence Fishburne", "Carrie-Anne Moss", "Hugo Weaving", "Joe Pantoliano"],
    rating: 8.7,
    runtime: 136,
    posterPath: "/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg",
    tagline: "Welcome to the Real World.",
    overview: "When a beautiful stranger leads computer hacker Neo to a forbidding underworld, he discovers the shocking truth--the life he knows is the elaborate deception of an evil cyber-intelligence."
  },
  {
    id: "tt0111161",
    title: "The Shawshank Redemption",
    year: 1994,
    director: "Frank Darabont",
    genres: ["Drama", "Crime"],
    cast: ["Tim Robbins", "Morgan Freeman", "Bob Gunton", "William Sadler", "Clancy Brown"],
    rating: 9.3,
    runtime: 142,
    posterPath: "/9cqNxx0GxF0bflZmeSMuL5tnGzr.jpg",
    tagline: "Fear can hold you prisoner. Hope can set you free.",
    overview: "Over the course of several years, two convicts form a friendship, seeking consolation and, eventually, redemption through basic compassion."
  },
  {
    id: "tt0068646",
    title: "The Godfather",
    year: 1972,
    director: "Francis Ford Coppola",
    genres: ["Crime", "Drama"],
    cast: ["Marlon Brando", "Al Pacino", "James Caan", "Robert Duvall", "Diane Keaton"],
    rating: 9.2,
    runtime: 175,
    posterPath: "/3bhkrj58Vtu7enYsRolD1fZdja1.jpg",
    tagline: "An offer you can't refuse.",
    overview: "The aging patriarch of an organized crime dynasty transfers control of his clandestine empire to his reluctant youngest son."
  },
  {
    id: "tt0407887",
    title: "The Departed",
    year: 2006,
    director: "Martin Scorsese",
    genres: ["Crime", "Drama", "Thriller"],
    cast: ["Leonardo DiCaprio", "Matt Damon", "Jack Nicholson", "Mark Wahlberg", "Martin Sheen"],
    rating: 8.5,
    runtime: 151,
    posterPath: "/nT97ifL22rRQqlThJWumKZQQNTg.jpg",
    tagline: "Lies. Betrayal. Sacrifice. How far will you take it?",
    overview: "An undercover cop and a mole in the police attempt to identify each other while infiltrating an Irish gang in South Boston."
  },
  {
    id: "tt0099685",
    title: "Goodfellas",
    year: 1990,
    director: "Martin Scorsese",
    genres: ["Biography", "Crime", "Drama"],
    cast: ["Robert De Niro", "Ray Liotta", "Joe Pesci", "Lorraine Bracco", "Paul Sorvino"],
    rating: 8.7,
    runtime: 145,
    posterPath: "/aKuFiU82s5ISJpGZZ7YkIr3kCUd.jpg",
    tagline: "Three decades of life in the mafia.",
    overview: "The story of Henry Hill and his life in the mafia, covering his relationship with his wife Karen and his mob partners Jimmy Conway and Tommy DeVito."
  },
  {
    id: "tt0172495",
    title: "Gladiator",
    year: 2000,
    director: "Ridley Scott",
    genres: ["Action", "Adventure", "Drama"],
    cast: ["Russell Crowe", "Joaquin Phoenix", "Connie Nielsen", "Oliver Reed", "Richard Harris"],
    rating: 8.5,
    runtime: 155,
    posterPath: "/ty8TGRuvJLPUmAR1H1nRIsgwvim.jpg",
    tagline: "What we do in life echoes in eternity.",
    overview: "A former Roman General sets out to exact vengeance against the corrupt emperor who murdered his family and sent him into slavery."
  },
  {
    id: "tt0120338",
    title: "Titanic",
    year: 1997,
    director: "James Cameron",
    genres: ["Drama", "Romance"],
    cast: ["Leonardo DiCaprio", "Kate Winslet", "Billy Zane", "Kathy Bates", "Bill Paxton"],
    rating: 7.9,
    runtime: 194,
    posterPath: "/9xjZS2rlVxm8SFx8kPC3aIGCOYQ.jpg",
    tagline: "Nothing on Earth could come between them.",
    overview: "A seventeen-year-old aristocrat falls in love with a kind but poor artist aboard the luxurious, ill-fated R.M.S. Titanic."
  },
  {
    id: "tt15398776",
    title: "Oppenheimer",
    year: 2023,
    director: "Christopher Nolan",
    genres: ["Biography", "Drama", "History"],
    cast: ["Cillian Murphy", "Emily Blunt", "Matt Damon", "Robert Downey Jr.", "Florence Pugh"],
    rating: 8.9,
    runtime: 180,
    posterPath: "/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
    tagline: "The world forever changes.",
    overview: "The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb during World War II."
  },
  {
    id: "tt0993846",
    title: "The Wolf of Wall Street",
    year: 2013,
    director: "Martin Scorsese",
    genres: ["Biography", "Comedy", "Crime"],
    cast: ["Leonardo DiCaprio", "Jonah Hill", "Margot Robbie", "Matthew McConaughey", "Kyle Chandler"],
    rating: 8.2,
    runtime: 180,
    posterPath: "/34m2tygAYBGqA9MXKhRDtzYd4MR.jpg",
    tagline: "EARN. SPEND. PARTY.",
    overview: "Based on the true story of Jordan Belfort, from his rise to a wealthy stock-broker living the high life to his fall involving crime, corruption and the federal government."
  },
  {
    id: "tt0114369",
    title: "Se7en",
    year: 1995,
    director: "David Fincher",
    genres: ["Crime", "Drama", "Mystery", "Thriller"],
    cast: ["Brad Pitt", "Morgan Freeman", "Gwyneth Paltrow", "Kevin Spacey", "R. Lee Ermey"],
    rating: 8.6,
    runtime: 127,
    posterPath: "/6yoghtyTpznpBik8EngEmJskVUO.jpg",
    tagline: "Seven deadly sins. Seven ways to die.",
    overview: "Two detectives, a rookie and a veteran, hunt a serial killer who uses the seven deadly sins as his motives."
  },
  {
    id: "tt0185906",
    title: "Django Unchained",
    year: 2012,
    director: "Quentin Tarantino",
    genres: ["Drama", "Western"],
    cast: ["Jamie Foxx", "Christoph Waltz", "Leonardo DiCaprio", "Kerry Washington", "Samuel L. Jackson"],
    rating: 8.5,
    runtime: 165,
    posterPath: "/7oWY8vd27zXxQGICNk6vAghWv7F.jpg",
    tagline: "Life, liberty and the pursuit of vengeance.",
    overview: "With the help of a German bounty-hunter, a freed slave sets out to rescue his wife from a brutal Mississippi plantation owner."
  },
  {
    id: "tt0361748",
    title: "Inglourious Basterds",
    year: 2009,
    director: "Quentin Tarantino",
    genres: ["Adventure", "Drama", "War"],
    cast: ["Brad Pitt", "Diane Kruger", "Eli Roth", "Christoph Waltz", "Michael Fassbender"],
    rating: 8.4,
    runtime: 153,
    posterPath: "/7sfbEnaARXDD5Km0CZ7D7KyOYAh.jpg",
    tagline: "Once upon a time in Nazi-occupied France...",
    overview: "In Nazi-occupied France during World War II, a plan to assassinate Nazi leaders by a group of Jewish U.S. soldiers coincides with a theatre owner's vengeful plans for the same."
  },
  {
    id: "tt0482571",
    title: "The Prestige",
    year: 2006,
    director: "Christopher Nolan",
    genres: ["Drama", "Mystery", "Sci-Fi", "Thriller"],
    cast: ["Christian Bale", "Hugh Jackman", "Scarlett Johansson", "Michael Caine", "David Bowie"],
    rating: 8.5,
    runtime: 130,
    posterPath: "/bdN3gXu4vL300Qj4tB4E9W3t2xR.jpg",
    tagline: "Are you watching closely?",
    overview: "After a tragic accident, two stage magicians in 1890s London engage in a battle to create the ultimate illusion while sacrificing everything they have to outwit each other."
  },
  {
    id: "tt7286456",
    title: "Joker",
    year: 2019,
    director: "Todd Phillips",
    genres: ["Crime", "Drama", "Thriller"],
    cast: ["Joaquin Phoenix", "Robert De Niro", "Zazie Beetz", "Frances Conroy", "Brett Cullen"],
    rating: 8.4,
    runtime: 122,
    posterPath: "/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg",
    tagline: "Put on a happy face.",
    overview: "During the 1980s, a failed stand-up comedian is driven insane and turns to a life of crime and chaos in Gotham City while becoming an infamous psychopathic crime figure."
  },
  {
    id: "tt0120815",
    title: "Saving Private Ryan",
    year: 1998,
    director: "Steven Spielberg",
    genres: ["Drama", "War"],
    cast: ["Tom Hanks", "Matt Damon", "Tom Sizemore", "Edward Burns", "Vin Diesel"],
    rating: 8.6,
    runtime: 169,
    posterPath: "/uqx37cS8cpHg8x35f9U5IBlrjp3.jpg",
    tagline: "The mission is a man.",
    overview: "Following the Normandy Landings, a group of U.S. soldiers go behind enemy lines to retrieve a paratrooper whose brothers have been killed in action."
  },
  {
    id: "tt1160419",
    title: "Dune",
    year: 2021,
    director: "Denis Villeneuve",
    genres: ["Action", "Adventure", "Sci-Fi"],
    cast: ["Timothée Chalamet", "Rebecca Ferguson", "Oscar Isaac", "Zendaya", "Josh Brolin"],
    rating: 8.0,
    runtime: 155,
    posterPath: "/d5NXSklXo0qyIYkgV94XAgMIckC.jpg",
    tagline: "It begins.",
    overview: "A noble family becomes embroiled in a war for control over the galaxy's most valuable asset while its heir becomes troubled by visions of a dark future."
  },
  {
    id: "tt2582802",
    title: "Whiplash",
    year: 2014,
    director: "Damien Chazelle",
    genres: ["Drama", "Music"],
    cast: ["Miles Teller", "J.K. Simmons", "Paul Reiser", "Melissa Benoist", "Austin Stowell"],
    rating: 8.5,
    runtime: 106,
    posterPath: "/7fn624j5lj3xTme2SgiLCeuedmO.jpg",
    tagline: "The road to greatness can take you to the edge.",
    overview: "A promising young drummer enrolls at a cut-throat music conservatory where his dreams of greatness are mentored by an instructor who will stop at nothing to realize a student's potential."
  },
  {
    id: "tt6751668",
    title: "Parasite",
    year: 2019,
    director: "Bong Joon Ho",
    genres: ["Comedy", "Drama", "Thriller"],
    cast: ["Song Kang-ho", "Lee Sun-kyun", "Cho Yeo-jeong", "Choi Woo-shik", "Park So-dam"],
    rating: 8.5,
    runtime: 132,
    posterPath: "/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg",
    tagline: "Act like you own the place.",
    overview: "Greed and class discrimination threaten the newly formed symbiotic relationship between the wealthy Park family and the destitute Kim clan."
  },
  {
    id: "tt0107290",
    title: "Jurassic Park",
    year: 1993,
    director: "Steven Spielberg",
    genres: ["Action", "Adventure", "Sci-Fi"],
    cast: ["Sam Neill", "Laura Dern", "Jeff Goldblum", "Richard Attenborough", "Samuel L. Jackson"],
    rating: 8.2,
    runtime: 127,
    posterPath: "/oU7Oq2kFAAlGqbU4VoAE36g4ho1.jpg",
    tagline: "An adventure 65 million years in the making.",
    overview: "A pragmatic paleontologist touring an almost complete theme park on an island in Central America is tasked with protecting a couple of kids after a power failure causes the cloned dinosaurs to run loose."
  },
  {
    id: "tt0102926",
    title: "The Silence of the Lambs",
    year: 1991,
    director: "Jonathan Demme",
    genres: ["Crime", "Drama", "Thriller"],
    cast: ["Jodie Foster", "Anthony Hopkins", "Scott Glenn", "Ted Levine", "Anthony Heald"],
    rating: 8.6,
    runtime: 118,
    posterPath: "/uS9m8OBk1A8eM9I042bx8xxpqAq.jpg",
    tagline: "To enter the mind of a killer she must challenge the mind of a madman.",
    overview: "A young F.B.I. cadet must receive the help of an incarcerated and manipulative cannibal killer to help catch another serial killer who skins his victims."
  },
  {
    id: "tt1856101",
    title: "Blade Runner 2049",
    year: 2017,
    director: "Denis Villeneuve",
    genres: ["Action", "Drama", "Mystery", "Sci-Fi"],
    cast: ["Ryan Gosling", "Harrison Ford", "Ana de Armas", "Sylvia Hoeks", "Robin Wright"],
    rating: 8.0,
    runtime: 164,
    posterPath: "/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg",
    tagline: "The key to the future is finally unearthed.",
    overview: "Young Blade Runner K's discovery of a long-buried secret leads him to track down former Blade Runner Rick Deckard, who's been missing for thirty years."
  },
  {
    id: "tt0088763",
    title: "Back to the Future",
    year: 1985,
    director: "Robert Zemeckis",
    genres: ["Adventure", "Comedy", "Sci-Fi"],
    cast: ["Michael J. Fox", "Christopher Lloyd", "Lea Thompson", "Crispin Glover", "Thomas F. Wilson"],
    rating: 8.5,
    runtime: 116,
    posterPath: "/fNOH9f1aA7XRTzl1sAOx9iF553Q.jpg",
    tagline: "He was never in time for his classes... He wasn't in time for his dinner... Then one day he wasn't in his time at all.",
    overview: "Marty McFly, a 17-year-old high school student, is accidentally sent 30 years into the past in a time-traveling DeLorean invented by his close friend, eccentric scientist Doc Brown."
  },
  {
    id: "tt0082971",
    title: "Raiders of the Lost Ark",
    year: 1981,
    director: "Steven Spielberg",
    genres: ["Action", "Adventure"],
    cast: ["Harrison Ford", "Karen Allen", "Paul Freeman", "John Rhys-Davies", "Ronald Lacey"],
    rating: 8.4,
    runtime: 115,
    posterPath: "/ceG9VzoRAVGwivFU407W8kh6iNX.jpg",
    tagline: "Indiana Jones - the new hero from the creators of JAWS and STAR WARS.",
    overview: "In 1936, archaeologist and adventurer Indiana Jones is hired by the U.S. government to find the Ark of the Covenant before Adolf Hitler's Nazis can obtain its awesome powers."
  },
  {
    id: "tt0081505",
    title: "The Shining",
    year: 1980,
    director: "Stanley Kubrick",
    genres: ["Drama", "Horror"],
    cast: ["Jack Nicholson", "Shelley Duvall", "Danny Lloyd", "Scatman Crothers", "Barry Nelson"],
    rating: 8.4,
    runtime: 146,
    posterPath: "/b33nnKl1GSFbao8l3fZkyRdfiov.jpg",
    tagline: "A masterpiece of modern horror.",
    overview: "A family heads to an isolated hotel for the winter where a sinister presence influences the father into violence, while his psychic son sees horrific forebodings from both past and future."
  },
  {
    id: "tt1392190",
    title: "Mad Max: Fury Road",
    year: 2015,
    director: "George Miller",
    genres: ["Action", "Adventure", "Sci-Fi"],
    cast: ["Tom Hardy", "Charlize Theron", "Nicholas Hoult", "Hugh Keays-Byrne", "Zoe Kravitz"],
    rating: 8.1,
    runtime: 120,
    posterPath: "/hA2ple9q4qnwxp3hKVNhroipsir.jpg",
    tagline: "What a Lovely Day.",
    overview: "In a post-apocalyptic wasteland, a woman rebels against a tyrannical ruler in search for her homeland with the aid of a group of female prisoners, a psychotic worshiper and a drifter named Max."
  },
  {
    id: "tt1285016",
    title: "The Social Network",
    year: 2010,
    director: "David Fincher",
    genres: ["Biography", "Drama"],
    cast: ["Jesse Eisenberg", "Andrew Garfield", "Justin Timberlake", "Armie Hammer", "Rooney Mara"],
    rating: 7.8,
    runtime: 120,
    posterPath: "/n0ybibhJtQ5icDqTpTzbRytNDPx.jpg",
    tagline: "You don't get to 500 million friends without making a few enemies.",
    overview: "As Harvard student Mark Zuckerberg creates the social networking site that would become known as Facebook, he is sued by the twins who claimed he stole their idea."
  },
  {
    id: "tt0477348",
    title: "No Country for Old Men",
    year: 2007,
    director: "Joel Coen",
    genres: ["Crime", "Drama", "Thriller"],
    cast: ["Tommy Lee Jones", "Javier Bardem", "Josh Brolin", "Woody Harrelson", "Kelly Macdonald"],
    rating: 8.2,
    runtime: 122,
    posterPath: "/6d5XOczke28JrB2V14t3t8nFqG2.jpg",
    tagline: "There are no clean getaways.",
    overview: "Violence and mayhem ensue after a hunter stumbles upon a drug deal gone wrong and more than two million dollars in cash near the Rio Grande."
  },
  {
    id: "tt4154796",
    title: "Avengers: Endgame",
    year: 2019,
    director: "Anthony Russo",
    genres: ["Action", "Adventure", "Sci-Fi"],
    cast: ["Robert Downey Jr.", "Chris Evans", "Mark Ruffalo", "Chris Hemsworth", "Scarlett Johansson"],
    rating: 8.4,
    runtime: 181,
    posterPath: "/or06FN3Dka5tukK1e9sl16pB3iy.jpg",
    tagline: "Part of the journey is the end.",
    overview: "After the devastating events of Infinity War, the universe is in ruins. With the help of remaining allies, the Avengers assemble once more in order to reverse Thanos' actions."
  },
  {
    id: "tt0075314",
    title: "Taxi Driver",
    year: 1976,
    director: "Martin Scorsese",
    genres: ["Crime", "Drama"],
    cast: ["Robert De Niro", "Jodie Foster", "Cybill Shepherd", "Albert Brooks", "Harvey Keitel"],
    rating: 8.2,
    runtime: 114,
    posterPath: "/ekstpH694DaPWAnbr419r6EG0xM.jpg",
    tagline: "On every street in every city, there's a nobody who dreams of being a somebody.",
    overview: "A mentally unstable veteran works as a nighttime taxi driver in New York City, where the perceived decadence and sleaze fuels his urge for violent action."
  },
  {
    id: "tt1130884",
    title: "Shutter Island",
    year: 2010,
    director: "Martin Scorsese",
    genres: ["Mystery", "Thriller"],
    cast: ["Leonardo DiCaprio", "Mark Ruffalo", "Ben Kingsley", "Michelle Williams", "Emily Mortimer"],
    rating: 8.2,
    runtime: 138,
    posterPath: "/4GDy0PHYX3VRXUtwKv51792qdg9.jpg",
    tagline: "Someone is missing.",
    overview: "In 1954, a U.S. Marshal investigates the disappearance of a murderer who escaped from a hospital for the criminally insane."
  },
  {
    id: "tt0209144",
    title: "Memento",
    year: 2000,
    director: "Christopher Nolan",
    genres: ["Mystery", "Thriller"],
    cast: ["Guy Pearce", "Carrie-Anne Moss", "Joe Pantoliano", "Mark Boone Junior", "Stephen Tobolowsky"],
    rating: 8.4,
    runtime: 113,
    posterPath: "/yuNs09hvpHVU1cBTCAk9zxsL2oW.jpg",
    tagline: "Some memories are best forgotten.",
    overview: "A man with short-term memory loss attempts to track down his wife's murderer."
  },
  {
    id: "tt0264464",
    title: "Catch Me If You Can",
    year: 2002,
    director: "Steven Spielberg",
    genres: ["Biography", "Crime", "Drama"],
    cast: ["Leonardo DiCaprio", "Tom Hanks", "Christopher Walken", "Martin Sheen", "Amy Adams"],
    rating: 8.1,
    runtime: 141,
    posterPath: "/ctjEj2xM32OvBXCq895T9cqbdNp.jpg",
    tagline: "The true story of a real fake.",
    overview: "Barely 21 yet, Frank is a skilled forger who has passed as a doctor, lawyer and pilot all while cashing millions of dollars in fraudulent checks."
  },
  {
    id: "tt0113277",
    title: "Heat",
    year: 1995,
    director: "Michael Mann",
    genres: ["Action", "Crime", "Drama"],
    cast: ["Al Pacino", "Robert De Niro", "Val Kilmer", "Jon Voight", "Tom Sizemore"],
    rating: 8.3,
    runtime: 170,
    posterPath: "/rrBuGu0PZqH99Co63fOh8p39q8c.jpg",
    tagline: "A Los Angeles crime saga.",
    overview: "A group of high-end professional thieves start to feel the LAPD on their tails when a loose-cannon partner leaves a clue at their latest heist."
  },
  {
    id: "tt2911666",
    title: "John Wick",
    year: 2014,
    director: "Chad Stahelski",
    genres: ["Action", "Crime", "Thriller"],
    cast: ["Keanu Reeves", "Michael Nyqvist", "Alfie Allen", "Willem Dafoe", "Dean Winters"],
    rating: 7.4,
    runtime: 101,
    posterPath: "/fZPS2tU16n5x4LwhU0B39fM990g.jpg",
    tagline: "Don't set him off.",
    overview: "An ex-hit-man comes out of retirement to track down the gangsters that took everything from him."
  },
  {
    id: "tt2278388",
    title: "The Grand Budapest Hotel",
    year: 2014,
    director: "Wes Anderson",
    genres: ["Adventure", "Comedy", "Crime"],
    cast: ["Ralph Fiennes", "Tony Revolori", "Saoirse Ronan", "Adrien Brody", "Willem Dafoe"],
    rating: 8.1,
    runtime: 99,
    posterPath: "/eWdyYQreja6JGCzqHWX9ne3rNq5.jpg",
    tagline: "A legendary concierge and his most trusted lobby boy.",
    overview: "A writer encounters the owner of an aging high-class hotel, who tells him of his early years serving as a lobby boy in the hotel's glorious years under an exceptional concierge."
  },
  {
    id: "tt3783958",
    title: "La La Land",
    year: 2016,
    director: "Damien Chazelle",
    genres: ["Comedy", "Drama", "Music", "Romance"],
    cast: ["Ryan Gosling", "Emma Stone", "John Legend", "Rosemarie DeWitt", "J.K. Simmons"],
    rating: 8.0,
    runtime: 128,
    posterPath: "/uDO8zWDhfWwoYbOo40FuA9b7Qrv.jpg",
    tagline: "Here's to the fools who dream.",
    overview: "While navigating their careers in Los Angeles, a pianist and an actress fall in love while attempting to reconcile their aspirations for the future."
  },
  {
    id: "tt0266697",
    title: "Kill Bill: Vol. 1",
    year: 2003,
    director: "Quentin Tarantino",
    genres: ["Action", "Crime", "Thriller"],
    cast: ["Uma Thurman", "Lucy Liu", "Vivica A. Fox", "Daryl Hannah", "David Carradine"],
    rating: 8.2,
    runtime: 111,
    posterPath: "/v7TaX8kXMXScW9LEiVCMMa13R8Z.jpg",
    tagline: "A roaring rampage of revenge.",
    overview: "After awakening from a four-year coma, a former assassin wreaks vengeance on the team of assassins who betrayed her."
  },
  {
    id: "tt0120382",
    title: "The Truman Show",
    year: 1998,
    director: "Peter Weir",
    genres: ["Comedy", "Drama", "Sci-Fi"],
    cast: ["Jim Carrey", "Laura Linney", "Noah Emmerich", "Natascha McElhone", "Ed Harris"],
    rating: 8.2,
    runtime: 103,
    posterPath: "/vuza0WqY239mu4EU8T4PpjwmmJJ.jpg",
    tagline: "On the air. Unaware.",
    overview: "An insurance salesman discovers his entire life is actually a reality TV show broadcast live around the clock across the globe."
  },
  {
    id: "tt0086250",
    title: "Scarface",
    year: 1983,
    director: "Brian De Palma",
    genres: ["Crime", "Drama"],
    cast: ["Al Pacino", "Michelle Pfeiffer", "Steven Bauer", "Robert Loggia", "Mary Elizabeth Mastrantonio"],
    rating: 8.3,
    runtime: 170,
    posterPath: "/iQ5ztdjvteGeboxtmRdXEChfOHh.jpg",
    tagline: "The world is yours.",
    overview: "In 1980 Miami, a determined Cuban immigrant takes over a drug cartel and succumbs to greed and paranoia."
  },
  {
    id: "tt8579674",
    title: "1917",
    year: 2019,
    director: "Sam Mendes",
    genres: ["Action", "Drama", "War"],
    cast: ["George MacKay", "Dean-Charles Chapman", "Mark Strong", "Colin Firth", "Benedict Cumberbatch"],
    rating: 8.2,
    runtime: 119,
    posterPath: "/iZfDDmq0MGuk89gX9x6fXGvs6G2.jpg",
    tagline: "Time is the enemy.",
    overview: "April 6th, 1917. As a regiment assembles to wage war deep in enemy territory, two soldiers are tasked to race against time and deliver a message that will stop 1,600 men from walking into a deadly trap."
  },
  {
    id: "tt0443706",
    title: "Zodiac",
    year: 2007,
    director: "David Fincher",
    genres: ["Crime", "Drama", "Mystery"],
    cast: ["Jake Gyllenhaal", "Mark Ruffalo", "Robert Downey Jr.", "Anthony Edwards", "Brian Cox"],
    rating: 7.7,
    runtime: 157,
    posterPath: "/6Yme5YfR359F4t4eG2gD81L8N7n.jpg",
    tagline: "There's more than one way to lose your life to a killer.",
    overview: "Between 1968 and 1983, a San Francisco cartoonist becomes an amateur detective obsessed with tracking down the Zodiac Killer, an unidentified individual who terrorizes Northern California."
  },
  {
    id: "tt0254388",
    title: "A Beautiful Mind",
    year: 2001,
    director: "Ron Howard",
    genres: ["Biography", "Drama"],
    cast: ["Russell Crowe", "Ed Harris", "Jennifer Connelly", "Paul Bettany", "Adam Goldberg"],
    rating: 8.2,
    runtime: 135,
    posterPath: "/zwzWCmH72OSC9NA0ipoqw5OyaHg.jpg",
    tagline: "I need to believe that something extraordinary is possible.",
    overview: "After John Nash, a brilliant but asocial mathematician, accepts secret work in cryptography, his life takes a turn for the nightmarish."
  },
  {
    id: "tt1392214",
    title: "Prisoners",
    year: 2013,
    director: "Denis Villeneuve",
    genres: ["Crime", "Drama", "Mystery"],
    cast: ["Hugh Jackman", "Jake Gyllenhaal", "Viola Davis", "Maria Bello", "Paul Dano"],
    rating: 8.1,
    runtime: 153,
    posterPath: "/uhvi7bQ38FqLgR4z0P6G1N88Pq4.jpg",
    tagline: "Every moment matters.",
    overview: "When Keller Dover's daughter and her friend go missing, he takes matters into his own hands as the police pursue multiple leads and the pressure mounts."
  },
  {
    id: "tt2543164",
    title: "Arrival",
    year: 2016,
    director: "Denis Villeneuve",
    genres: ["Drama", "Mystery", "Sci-Fi"],
    cast: ["Amy Adams", "Jeremy Renner", "Forest Whitaker", "Michael Stuhlbarg", "Mark O'Brien"],
    rating: 7.9,
    runtime: 116,
    posterPath: "/x2FJsf1ElAgr63Y3PNPtJrcmpoe.jpg",
    tagline: "Why are they here?",
    overview: "A linguist works with the military to communicate with alien lifeforms after twelve mysterious spacecraft appear around the world."
  },
  {
    id: "tt0118715",
    title: "The Big Lebowski",
    year: 1998,
    director: "Joel Coen",
    genres: ["Comedy", "Crime"],
    cast: ["Jeff Bridges", "John Goodman", "Julianne Moore", "Steve Buscemi", "David Huddleston"],
    rating: 8.1,
    runtime: 117,
    posterPath: "/9PXZI1h2B9r7t8mE4vU8qGz9N8.jpg",
    tagline: "Times like these call for a Big Lebowski.",
    overview: "Jeff 'The Dude' Lebowski, mistaken for a millionaire of the same name, seeks restitution for his ruined rug and enlists his bowling buddies to help get it."
  },
  {
    id: "tt0116282",
    title: "Fargo",
    year: 1996,
    director: "Joel Coen",
    genres: ["Crime", "Thriller"],
    cast: ["William H. Macy", "Frances McDormand", "Steve Buscemi", "Peter Stormare", "Harve Presnell"],
    rating: 8.1,
    runtime: 98,
    posterPath: "/rt7cpEr1u9fK1xAz0S2xG039vN.jpg",
    tagline: "A lot can happen in the middle of nowhere.",
    overview: "Jerry Lundegaard's inept crime falls apart due to his and his henchmen's bungling and the persistent police work of the quite pregnant Marge Gunderson."
  },
  {
    id: "tt0112641",
    title: "Casino",
    year: 1995,
    director: "Martin Scorsese",
    genres: ["Crime", "Drama"],
    cast: ["Robert De Niro", "Sharon Stone", "Joe Pesci", "James Woods", "Don Rickles"],
    rating: 8.2,
    runtime: 178,
    posterPath: "/4TS5O18Vvv7B2wU0SpXz18V2N7k.jpg",
    tagline: "No one stays at the top forever.",
    overview: "A tale of greed, deception, money, power, and murder between two best friends: a mafia enforcer and a casino executive compete against each other over a gambling empire."
  },
  {
    id: "tt7131622",
    title: "Once Upon a Time in Hollywood",
    year: 2019,
    director: "Quentin Tarantino",
    genres: ["Comedy", "Drama"],
    cast: ["Leonardo DiCaprio", "Brad Pitt", "Margot Robbie", "Emile Hirsch", "Margaret Qualley"],
    rating: 7.6,
    runtime: 161,
    posterPath: "/8j58iEBw9pOXFD2L0nt0ZXeHviB.jpg",
    tagline: "In 1969, our world changed forever.",
    overview: "A faded television actor and his stunt double strive to achieve fame and success in the film industry during the final years of Hollywood's Golden Age in 1969 Los Angeles."
  },
  {
    id: "tt1798709",
    title: "Her",
    year: 2013,
    director: "Spike Jonze",
    genres: ["Drama", "Romance", "Sci-Fi"],
    cast: ["Joaquin Phoenix", "Amy Adams", "Rooney Mara", "Olivia Wilde", "Scarlett Johansson"],
    rating: 8.0,
    runtime: 126,
    posterPath: "/eCOtqtfvn7mxGl6nfmq4bupO75b.jpg",
    tagline: "A Spike Jonze love story.",
    overview: "In a near future, a lonely writer develops an unlikely relationship with an operating system designed to meet his every need."
  },
  {
    id: "tt0120689",
    title: "The Green Mile",
    year: 1999,
    director: "Frank Darabont",
    genres: ["Crime", "Drama", "Fantasy"],
    cast: ["Tom Hanks", "Michael Clarke Duncan", "David Morse", "Bonnie Hunt", "James Cromwell"],
    rating: 8.6,
    runtime: 189,
    posterPath: "/velWPhVMQeQKcxggNEU8YmIo52R.jpg",
    tagline: "Miracles happen in the most unexpected places.",
    overview: "The lives of guards on Death Row are affected by one of their charges: a black man accused of child murder and rape, yet who has a mysterious gift."
  },
  {
    id: "tt0110357",
    title: "The Lion King",
    year: 1994,
    director: "Roger Allers",
    genres: ["Animation", "Adventure", "Drama"],
    cast: ["Matthew Broderick", "Jeremy Irons", "James Earl Jones", "Whoopi Goldberg", "Nathan Lane"],
    rating: 8.5,
    runtime: 88,
    posterPath: "/sKCr78MXSLixwmZ8DyJLrpMsd15.jpg",
    tagline: "The greatest adventure of all is finding our place in the circle of life.",
    overview: "Lion prince Simba and his father are targeted by his bitter uncle, who wants to ascend the throne himself."
  },
  {
    id: "tt0114814",
    title: "The Usual Suspects",
    year: 1995,
    director: "Bryan Singer",
    genres: ["Crime", "Drama", "Mystery"],
    cast: ["Kevin Spacey", "Gabriel Byrne", "Chazz Palminteri", "Stephen Baldwin", "Benicio del Toro"],
    rating: 8.5,
    runtime: 106,
    posterPath: "/bUPmtQzrRhzg2bQhDaHMva9HRjj.jpg",
    tagline: "The greatest trick the devil ever pulled was convincing the world he didn't exist.",
    overview: "A sole survivor tells of the twisty events leading up to a horrific gun battle on a boat, which began when five criminals met at a seemingly random police lineup."
  },
  {
    id: "tt0372784",
    title: "Batman Begins",
    year: 2005,
    director: "Christopher Nolan",
    genres: ["Action", "Crime", "Drama"],
    cast: ["Christian Bale", "Michael Caine", "Liam Neeson", "Katie Holmes", "Gary Oldman"],
    rating: 8.2,
    runtime: 140,
    posterPath: "/4MpN4kIEqUjW8OPt7AvBEblA42U.jpg",
    tagline: "Evil fears the knight.",
    overview: "After training with his mentor, Batman begins his fight to free crime-ridden Gotham City from corruption."
  },
  {
    id: "tt0469494",
    title: "There Will Be Blood",
    year: 2007,
    director: "Paul Thomas Anderson",
    genres: ["Drama"],
    cast: ["Daniel Day-Lewis", "Paul Dano", "Kevin J. O'Connor", "Ciarán Hinds", "Dillon Freasier"],
    rating: 8.2,
    runtime: 158,
    posterPath: "/fa0RDkAlCec0STkMKNHGELspFrEp.jpg",
    tagline: "When ambition meets faith.",
    overview: "A story of family, religion, hatred, oil and madness, focusing on a turn-of-the-century prospector in the early days of the business."
  },
  {
    id: "tt0947798",
    title: "Black Swan",
    year: 2010,
    director: "Darren Aronofsky",
    genres: ["Drama", "Thriller"],
    cast: ["Natalie Portman", "Mila Kunis", "Vincent Cassel", "Barbara Hershey", "Winona Ryder"],
    rating: 8.0,
    runtime: 108,
    posterPath: "/rH199UeXZ6aarCYzT5mG0Z17FfU.jpg",
    tagline: "I was perfect.",
    overview: "A committed dancer wins the lead role in a production of Tchaikovsky's Swan Lake only to find herself struggling to maintain her sanity."
  }
];

/**
 * Deterministic integer hash for any YYYY-MM-DD date string.
 * Guarantees every player worldwide gets the exact same movie on that day.
 */
export function getSpotleMovieForDate(dateStr) {
  if (!dateStr || dateStr === 'Today') {
    dateStr = new Date().toISOString().slice(0, 10);
  }
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash << 5) - hash + dateStr.charCodeAt(i);
    hash |= 0;
  }
  const positiveIndex = Math.abs(hash) % SPOTLE_MOVIES.length;
  return SPOTLE_MOVIES[positiveIndex];
}

/**
 * Compares a guessed movie against the target mystery movie.
 * Produces color statuses (EXACT, CLOSE/PARTIAL, MISS) and directional arrows (HIGHER, LOWER, EQUAL).
 */
export function compareSpotleMovies(guessed, target) {
  if (!guessed || !target) return null;

  const isExactWin = guessed.id === target.id || guessed.title.toLowerCase().trim() === target.title.toLowerCase().trim();

  // 1. Release Year
  const yearDiff = target.year - guessed.year;
  const yearDirection = yearDiff > 0 ? 'HIGHER' : yearDiff < 0 ? 'LOWER' : 'EQUAL';
  const yearStatus = yearDiff === 0 ? 'EXACT' : Math.abs(yearDiff) <= 3 ? 'CLOSE' : 'MISS';

  // 2. Director
  const guessedDir = (guessed.director || '').trim().toLowerCase();
  const targetDir = (target.director || '').trim().toLowerCase();
  const directorStatus = guessedDir === targetDir ? 'EXACT' : 'MISS';

  // 3. Genres
  const guessedGenres = (guessed.genres || []).map(g => g.toLowerCase().trim());
  const targetGenres = (target.genres || []).map(g => g.toLowerCase().trim());
  const matchingGenres = (guessed.genres || []).filter(g =>
    targetGenres.includes(g.toLowerCase().trim())
  );
  let genreStatus = 'MISS';
  if (matchingGenres.length > 0) {
    if (
      matchingGenres.length === targetGenres.length &&
      matchingGenres.length === guessedGenres.length
    ) {
      genreStatus = 'EXACT';
    } else {
      genreStatus = 'PARTIAL';
    }
  }

  // 4. Lead Cast / Stars
  const targetCastLower = (target.cast || []).map(c => c.toLowerCase().trim());
  const matchingCast = (guessed.cast || []).filter(actor =>
    targetCastLower.some(tc => tc.includes(actor.toLowerCase().trim()) || actor.toLowerCase().trim().includes(tc))
  );
  let castStatus = 'MISS';
  if (matchingCast.length >= 2 || (matchingCast.length >= 1 && (target.cast?.length || 0) <= 2)) {
    castStatus = 'EXACT';
  } else if (matchingCast.length >= 1) {
    castStatus = 'PARTIAL';
  }

  // 5. Score / Rating
  const ratingDiff = Number((target.rating - guessed.rating).toFixed(1));
  const ratingDirection = ratingDiff > 0 ? 'HIGHER' : ratingDiff < 0 ? 'LOWER' : 'EQUAL';
  const ratingStatus = Math.abs(ratingDiff) <= 0.2 ? 'EXACT' : Math.abs(ratingDiff) <= 0.8 ? 'CLOSE' : 'MISS';

  // 6. Runtime (in minutes)
  const runtimeDiff = target.runtime - guessed.runtime;
  const runtimeDirection = runtimeDiff > 0 ? 'HIGHER' : runtimeDiff < 0 ? 'LOWER' : 'EQUAL';
  const runtimeStatus = Math.abs(runtimeDiff) <= 10 ? 'EXACT' : Math.abs(runtimeDiff) <= 25 ? 'CLOSE' : 'MISS';

  return {
    isExactWin,
    guessedMovie: guessed,
    attributes: {
      year: {
        value: guessed.year,
        status: isExactWin ? 'EXACT' : yearStatus,
        direction: yearDirection,
        diff: yearDiff
      },
      director: {
        value: guessed.director,
        status: isExactWin ? 'EXACT' : directorStatus
      },
      genres: {
        value: guessed.genres || [],
        matching: matchingGenres,
        status: isExactWin ? 'EXACT' : genreStatus
      },
      cast: {
        value: (guessed.cast || []).slice(0, 3),
        matching: matchingCast,
        status: isExactWin ? 'EXACT' : castStatus
      },
      rating: {
        value: guessed.rating,
        status: isExactWin ? 'EXACT' : ratingStatus,
        direction: ratingDirection,
        diff: ratingDiff
      },
      runtime: {
        value: `${guessed.runtime}m`,
        status: isExactWin ? 'EXACT' : runtimeStatus,
        direction: runtimeDirection,
        diff: runtimeDiff
      }
    }
  };
}
