(function () {
  const curriculum = window.MILO_CURRICULUM;
  if (!curriculum) return;

  const readings = {
    2: [
      {
        fiction:
          "An has math, science and music on Monday. Science is interesting, but math is sometimes difficult. After school, An practises the violin and finishes a busy day.",
        factual:
          "A timetable shows the lessons for each school day. It helps children bring the right books, arrive on time and plan practice after class.",
      },
      {
        fictionTitle: "Reading 1 · Milo's Habitat Mission",
        fiction:
          "Milo follows tracks beside a river. He sees a crocodile near the water and a cheetah on the grass. He uses a map to match each animal with its safe habitat.",
        factualTitle: "Reading 2 · Animal Homes",
        factual:
          "A habitat gives an animal food, water and shelter. Camels live in deserts, whales live in oceans, and crocodiles live near rivers. Body shape and behavior help each animal survive there.",
      },
      {
        fiction:
          "Lan wears boots and a scarf on a cold morning. Thunder begins at noon, so the children stay inside. After the storm, they jump over puddles.",
        factual:
          "Weather changes when air, water and temperature change. Dark clouds can bring rain, while strong winds may bring storms, hail or even tornadoes.",
      },
      {
        fiction:
          "Milo visits a busy city with his aunt. The library is across from the bank, and the toy store is behind the bookstore. They meet at the train station.",
        factual:
          "Cities have homes, streets, shops and public buildings. Maps and signs help people find places and travel safely through busy traffic.",
      },
      {
        fiction:
          "Mai prepares a birthday party with balloons and candles. Her friends bring cards and share cupcakes. Everyone sings, laughs and says thank you.",
        factual:
          "People celebrate special days in many ways. They may prepare food, invite family, decorate a room and choose an activity that everyone can enjoy.",
      },
      {
        fiction:
          "Nam wants to be a vet because he loves animals. His sister dreams of becoming an astronaut. They study hard and help each other practise.",
        factual:
          "Every job uses different skills. Doctors care for people, chefs cook food, photographers take pictures, and police officers help keep communities safe.",
      },
      {
        fiction:
          "Linh learns badminton at school. At first, she cannot hit the shuttlecock. She keeps practising, follows the rules and cheers when her team plays fairly.",
        factual:
          "Sports help children build strength, balance and teamwork. Safe players listen to instructions, use the correct equipment and respect other players.",
      },
      {
        fiction:
          "Milo has a toothache after eating too many sweets. He tells an adult, visits a dentist and learns to brush carefully every morning and evening.",
        factual:
          "Healthy teeth help us bite, chew and speak. Toothpaste, a toothbrush and regular dental checks protect teeth and help our mouths feel clean.",
      },
      {
        fiction:
          "In spring, Hoa plants seeds with her grandfather. In summer, she waters the garden. During fall, leaves change colour, and winter brings cold mornings.",
        factual:
          "Earth's seasons change during the year. Places in the North and South can have different seasons at the same time because Earth moves around the Sun.",
      },
      {
        fiction:
          "Bao is active and chatty, while Linh is quiet and creative. They look different and enjoy different games, but both friends are kind and helpful.",
        factual:
          "People have different faces, hair, interests and strengths. Respect means listening, speaking politely and giving everyone a chance to take part.",
      },
      {
        fiction:
          "Milo and Luna enter a maze. They read each clue, measure a path and add two numbers. Working together helps them find the exit.",
        factual:
          "People solve problems by understanding the question, making a plan and checking each step. A drawing, map or number sentence can make a solution clearer.",
      },
      {
        fiction:
          "Minh walks beside a lake with his family. They watch wildlife, take pictures and leave every shell and plant in its natural home.",
        factual:
          "Outdoor activity gives our bodies movement and fresh air. Responsible visitors stay on safe paths, protect wildlife and take their rubbish home.",
      },
    ],
    3: [
      {
        fiction:
          "Jenny needs to meet Benny at the museum, but she takes a wrong turn downtown. She checks a map, follows the signs and crosses beside the bridge. A friendly shopkeeper tells her to walk along the harbour. Jenny arrives on time and thanks him for helping.",
        factual:
          "Maps use symbols to show roads, buildings and natural features. A map made to scale shows how distances compare in the real world. Direction words such as above, below, beside, along and around help people explain a route clearly.",
      },
      {
        fiction:
          "During a class visit, Minh sees a dinosaur fossil in a museum. He imagines the animal walking across an ancient forest. In another room, he studies a golden object from an Egyptian tomb. He wonders how archaeologists discovered it without damaging the treasure.",
        factual:
          "Scientists learn about the past from evidence. Fossils can show the size, food and movement of extinct animals. Archaeologists examine buildings, tools, bones and writing left by people. They record where each object is found before deciding what it may mean.",
      },
      {
        fiction:
          "Mai's family camps near a quiet coast. They set up a tent before sunset and cook on a camping stove. The next morning, they wear life jackets and go kayaking. When dark clouds appear, they return early, clean the campsite and check that nobody has left rubbish.",
        factual:
          "A safe vacation needs planning. Travellers check the weather, choose suitable clothes and carry a map or compass. At a campsite, people should protect plants, control fires and store food carefully. Near water, a life jacket is important even for confident swimmers.",
      },
      {
        fiction:
          "A young gardener finds one silver coin beside a giant sunflower. A prince offers to buy the flower, but the gardener refuses because it gives shade to the whole village. In the end, the prince understands that a useful gift can be more valuable than a bag of gold.",
        factual:
          "Stories can entertain, explain ideas and pass values from one generation to another. A myth often explains a natural event, while a legend may grow from a real person or place. Characters, problems and endings help readers understand the message.",
      },
      {
        fiction:
          "Luna finds an injured bird near an empty field. She calls a rescue centre and waits quietly until help arrives. Later, her class plants flowers for insects and makes signs asking visitors not to throw rubbish. The small project brings fresh life back to the area.",
        factual:
          "Healthy environments provide clean air, water, food and safe habitats. Pollution can harm lungs, plants and wildlife. People can save electricity, reduce waste and protect local species. Even a small action becomes powerful when many families take part.",
      },
      {
        fiction:
          "Milo has a gift budget and visits three stalls. He compares prices, counts his money and checks the time. A colourful notebook is useful and costs less than the toy. He buys it, keeps the receipt and still has enough money for the bus home.",
        factual:
          "Numbers help people measure time, money, distance and quantity. Sixty seconds make one minute, and sixty minutes make one hour. Shoppers use addition and subtraction to compare prices and change. Units such as a pair, a pack and a piece describe amounts.",
      },
      {
        fiction:
          "Nami joins a school music afternoon. She is nervous before playing the cello, but her friends clap to the rhythm. After the performance, the group reads a magazine review and discusses one thing they did well and one thing they want to improve.",
        factual:
          "Entertainment includes music, games, films, reading and live performance. An orchestra combines instruments with different sounds. Traditional entertainment connects people with history, while modern technology lets audiences enjoy performances from many places.",
      },
      {
        fiction:
          "Koby looks through a telescope and sees the bright Moon. In his dream, he launches in a rocket and floats inside a space station. He helps a scientist carry equipment to a laboratory. Before returning to Earth, he watches a sunrise move across the planet.",
        factual:
          "Space is nearly empty, so sound cannot travel there as it does through air. Astronauts float because the space station and everything inside it are falling around Earth together. Telescopes collect light and help scientists study distant planets and stars.",
      },
      {
        fiction:
          "A family moves from a city apartment to a houseboat on a canal. At first, the stairs and small rooms feel strange. Soon, the children enjoy watching birds from the roof and greeting neighbours from the balcony. The new home becomes comfortable in a different way.",
        factual:
          "Homes are designed for climate, space, materials and local ways of life. A farmhouse supports work in the countryside, while an apartment uses space in a busy city. A houseboat must float safely and protect the people inside from changing water levels.",
      },
      {
        fiction:
          "A sneeze spreads glitter across a classroom model, showing how quickly germs can travel. The students wash their hands with soap, cover coughs and open a window. One child with a fever rests at home until a doctor says it is safe to return.",
        factual:
          "Germs are tiny organisms, and some can make people ill. Handwashing removes many germs before they reach the eyes, nose or mouth. Sleep, exercise, healthy food and clean water support the body, but medicine should only be used with help from an adult.",
      },
      {
        fiction:
          "An explorer reaches a research station in Antarctica during a freezing wind. Thick clothing protects her skin, and special equipment keeps the team safe. Outside, she watches penguins huddle together. Their behaviour gives her an idea for saving warmth inside the station.",
        factual:
          "Antarctica is the coldest continent and stores a large amount of Earth's fresh water as ice. Animals survive with body fat, waterproof feathers or group behaviour. Researchers study the climate there because changes in Antarctic ice can affect oceans around the world.",
      },
      {
        fiction:
          "Lan carries a handmade lantern in a spring parade. She wears a traditional costume and walks beside dancers and musicians. A visitor asks about the celebration, so Lan explains its story and invites the visitor to share food with her family.",
        factual:
          "Festivals bring communities together to remember history, beliefs, seasons or important events. Costumes, music, food and decorations can carry cultural meaning. Respectful visitors ask questions, follow local rules and learn why each tradition is special.",
      },
    ],
    4: [
      {
        fiction:
          "Tuan wants to improve the lunch he brings to school. His first lunch has fried food and a sweet drink, so he feels tired during afternoon practice. With his family, he plans a colourful meal with grilled fish, vegetables, brown rice and fruit. The new lunch still tastes good, but it gives him steadier energy. Tuan learns that eating well is not about banning every favourite food; it is about balance, variety and sensible portions.",
        factual:
          "Food provides nutrients that the body uses for growth, movement and repair. Protein helps build tissue, carbohydrates provide energy, and healthy fats support cells. Vitamins and minerals perform many jobs, while fibre helps digestion. A balanced plate often includes vegetables or fruit, a source of protein and a grain. Cooking methods matter too: boiling, steaming or grilling may use less added fat than frying. Water is usually a better everyday drink than a sugary one.",
      },
      {
        fiction:
          "A class studies an old stone tower that stands beside a modern glass museum. The students measure shadows, sketch arches and interview an architect. They discover that the tower survived because its thick walls spread weight carefully. For their project, they design a small bridge from paper and test how much it can hold. The strongest model is not the prettiest one, but it uses triangles and supports in a thoughtful way.",
        factual:
          "Famous buildings often combine purpose, engineering, history and artistic design. An arch can carry weight around an opening, while a tower needs a stable base to resist wind. Builders choose materials such as stone, wood, steel or concrete according to strength, cost and climate. Monuments may become landmarks because people connect them with important events. Protecting an old building requires careful repair so that new work does not erase its original character.",
      },
      {
        fiction:
          "A young volunteer visits a wildlife sanctuary and meets an injured animal rescued from a poacher's trap. She helps prepare food, cleans an enclosure and records the animal's progress. When the animal becomes strong enough, the team releases it near a protected forest. The volunteer realises that saving one animal matters, but protecting the whole habitat is the best way to help a species survive.",
        factual:
          "A species becomes endangered when its population falls to a dangerous level. Habitat loss, hunting, pollution and climate change can all increase the risk. Conservation teams protect breeding areas, stop illegal trade and work with local communities. Sanctuaries care for animals that cannot immediately return to the wild. Successful protection also needs reliable data: scientists count animals, study movement and measure whether the ecosystem is recovering.",
      },
      {
        fiction:
          "For one week, a family keeps every piece of rubbish in separate containers. They are surprised by the amount of plastic packaging they use. The children wash glass jars for reuse, turn cardboard into storage boxes and carry refillable bottles. At the end of the week, the rubbish bag is much smaller. The family creates a simple rule: refuse what they do not need, reuse what they can and recycle correctly.",
        factual:
          "Waste does not disappear when it leaves a home. Some rubbish goes to landfill, where it can remain for many years. Recycling plants separate useful materials such as metal, glass, paper and certain plastics, but dirty or mixed items may not be recyclable. Reducing waste is usually more effective than recycling it later. Products designed for repair, refill or repeated use protect natural resources and reduce the energy required to manufacture replacements.",
      },
      {
        fiction:
          "Three friends interview adults about their jobs. A scientist says curiosity helps her ask useful questions. A musician explains that daily practice matters more than waiting for inspiration. A surgeon describes the teamwork needed in an operating room. The friends notice that every career combines knowledge, habits and personal qualities. Instead of choosing only by salary or fame, they make a list of tasks they enjoy and skills they want to develop.",
        factual:
          "Choosing a career begins with understanding interests, strengths and values. Some jobs focus on people, while others focus on ideas, tools, nature or creative expression. Training may happen at school, university, in an apprenticeship or directly at work. Careers also change as technology and society change. A good plan stays flexible: learners can explore, practise transferable skills, ask questions and update their goals when they discover new information.",
      },
      {
        fiction:
          "During a mountain trip, the weather changes suddenly and one hiker begins to shiver. The group stops, replaces wet clothes and finds shelter from the wind. Their leader checks everyone for signs of hypothermia and calls for help. Nobody continues just to reach the top. The decision feels disappointing, but returning safely proves that good judgement is more important than finishing a challenge.",
        factual:
          "Extreme heat and cold place stress on the human body. In heat, perspiration cools the skin, but losing too much water can cause dehydration or heatstroke. In cold conditions, blood flow changes and exposed skin may become numb. Volcanoes create different dangers, including ash, toxic gases, lava and falling rock. Safety plans use forecasts, protective equipment, clear communication and agreed points at which people must stop or leave.",
      },
      {
        fiction:
          "A student finds an old photograph of her grandmother wearing a handmade wool cardigan. She compares it with a modern jacket made from artificial fibres. For a fashion project, she repairs the cardigan, adds a new ribbon and tells its story on stage. Her classmates learn that fashion changes, but clothing can also carry memories, skills and ideas from the past.",
        factual:
          "Fashion changes because of climate, technology, culture, cost and personal expression. Natural fibres such as cotton, wool and silk come from plants or animals, while artificial fibres are manufactured. Designers consider colour, shape, comfort and purpose. Fast production can make clothing cheaper, but it may also increase waste. Repairing, sharing and choosing durable items can reduce the environmental impact of what people wear.",
      },
      {
        fiction:
          "A school performance mixes ballet, hip-hop and a short comedy. At rehearsal, the music is too loud and the dancers miss the rhythm. The director asks the performers to watch one another and count carefully. On the final night, the audience laughs, claps and joins the last song. The students understand that entertainment may look effortless, but it depends on planning, editing, practice and cooperation.",
        factual:
          "Entertainment has developed with new technology. Live theatre once required an audience to be in the same place as the performers. Recording, radio, cinema, television and online media later allowed stories and music to travel widely. Each form shapes the experience differently: editing can change time, close-up images can show emotion, and live performance creates direct contact. Audiences also influence what is produced through attention, reviews and participation.",
      },
      {
        fiction:
          "A solo sailor begins a difficult journey across rough water. During the night, a wave damages part of the boat and the navigation screen stops working. She uses a compass, checks the stars and repairs a rope before the next storm. Fear and loneliness do not disappear, but she follows her plan one step at a time. At sunrise, a distant lighthouse shows that the harbour is close.",
        factual:
          "Adventure stories place characters in uncertain situations where choices have clear consequences. A strong plot often includes a goal, obstacles, rising tension and a turning point. Physical danger creates excitement, but inner challenges such as fear, doubt or loneliness make a character believable. Readers continue because they want to know both what happens and how the experience changes the person facing it.",
      },
      {
        fiction:
          "Students organise a small charity fair to support a community library. One group collects books, another designs a website, and a third prepares a performance. At first, they focus only on raising money. After speaking with the librarian, they also create reading activities and a plan for future volunteers. The event succeeds because the students listen to what the community actually needs.",
        factual:
          "Charities use time, skills, goods and money to address a need. Responsible organisations explain their goals, record donations and report how resources are used. Before helping, people should learn about the issue and speak with those affected. A successful project has a clear purpose, realistic costs and a way to measure results. Long-term support may be more useful than a single event if the need continues.",
      },
      {
        fiction:
          "Two new classmates seem very different. One is talkative and loves group games; the other is quiet and enjoys drawing alone. They disagree during a project because each thinks the other is not working. When they explain their ideas, they discover that both care about detail and both want the team to succeed. They divide the tasks fairly and combine a confident presentation with thoughtful artwork.",
        factual:
          "People can be similar in one way and different in another. Personality is influenced by experience, culture, relationships and individual preference. Words such as quiet, creative or stubborn describe behaviour, but they do not explain everything about a person. Fair judgement uses several examples and allows people to change. Empathy means trying to understand another point of view before deciding how to respond.",
      },
      {
        fiction:
          "A child from the present visits a reconstructed village from the past. She helps carry water, watches bread bake in a shared oven and rides in a horse-drawn cart. The work is slower than at home, but neighbours cooperate closely. When she returns, she compares the old village with her modern suburb and notices that new technology saves time while some older community habits are still valuable.",
        factual:
          "Daily life in the past depended on place, wealth, work and available technology. Before modern transport, many people lived close to where they worked. Factories and railways later changed towns, travel and employment. Historical evidence includes photographs, objects, buildings, letters and official records. Researchers compare several sources because one source may show only part of the story or reflect one person's experience.",
      },
    ],
    5: [
      {
        fiction:
          "A young inventor notices that her grandfather forgets to water the plants when the weather is hot. She builds a simple device with a bottle, a tube and a small sensor. The first model leaks, and the second gives every plant too much water. Instead of giving up, she records each failure and changes one part at a time. Her final model delivers water only when the soil is dry. At the school exhibition, she explains that the best feature is not its appearance but the real problem it solves.",
        factual:
          "Inventions are created to meet needs, reduce effort, improve safety or make new activities possible. Most inventions develop through repeated design, testing and revision rather than one sudden idea. A washing machine combines mechanical movement with controls, while an electronic device uses circuits to process signals. Manufacturing then requires accurate parts and consistent quality. An invention can also create new problems, such as waste or high energy use, so designers evaluate cost, usefulness, durability and environmental impact before deciding that a solution is successful.",
      },
      {
        fiction:
          "While helping clean an old house, Bao discovers a diary inside a wooden box. The writer describes a flood that changed the town a century earlier. Bao compares the diary with a newspaper record and a map in the local museum. Some details match, while others are different because the diary shows one person's experience. Bao creates an exhibition that labels each source and explains which claims are certain, which are likely and which still need more evidence.",
        factual:
          "Historians study written records, objects, buildings, images and oral accounts to understand the past. A primary source comes from the period being studied, while a later explanation is a secondary source. Neither type is automatically perfect. Writers may forget, misunderstand or present events from a limited point of view. Researchers ask who created a source, why it was created and whether other evidence supports it. Careful comparison helps historians build conclusions that can be revised when new evidence appears.",
      },
      {
        fiction:
          "A family moves to a new country after a storm destroys their work and home. Each person carries only a small bag of essential belongings. The children feel nervous about a new language and school, but a neighbour helps them find the bus and introduces them to classmates. Months later, the family cooks food from their old home for a community event. They are building a new life without forgetting the people, places and traditions that remain part of their identity.",
        factual:
          "People move for many reasons, including work, education, family, safety, politics and environmental change. An immigrant chooses or plans to settle in another country, while a refugee is forced to leave because remaining is unsafe. Moving can offer opportunity, but it may also involve language barriers, unfamiliar laws and separation from family. Communities support newcomers through accurate information, education and fair access to services. Understanding personal stories prevents broad labels from replacing the complex reasons behind each journey.",
      },
      {
        fiction:
          "During a sports event, a runner falls and badly cuts his knee. His friends want to move him immediately, but Mai remembers her first-aid training. She checks the area for danger, asks an adult to call emergency services and speaks calmly to the injured runner. The team keeps other people back and follows the paramedic's instructions. Later, Mai says that being helpful did not mean acting quickly without thinking; it meant protecting everyone and choosing the safest action.",
        factual:
          "Safety decisions follow a clear order: notice danger, protect yourself, assess the situation and call suitable help. First aid can support an injured person until professionals arrive, but it does not replace medical care. Different emergencies require different responses, so untrained people should avoid treatments they do not understand. Protective equipment, attentive supervision and practice drills reduce risk before an accident occurs. After an incident, teams review what happened so that procedures and environments can be improved.",
      },
      {
        fiction:
          "A conservation team prepares to release a rescued pangolin. The animal has recovered, but the forest still contains roads and illegal traps. A student volunteer helps examine maps and camera images to identify a safer area. Local residents agree to report hunting and protect a water source. When the pangolin disappears into the trees, the team continues monitoring. They know that release is one step; long-term survival depends on a healthy habitat and the support of people living nearby.",
        factual:
          "Biodiversity describes the variety of life within genes, species and ecosystems. Each species interacts with food, water, shelter, predators and competitors. When a population becomes very small, disease or habitat change can increase the risk of extinction. Conservation may include protected areas, captive breeding, habitat restoration and laws against illegal trade. Scientists measure population trends and ecosystem balance to judge whether action is working. Effective plans also involve local communities, because protection must support both wildlife and human needs.",
      },
      {
        fiction:
          "A class reads the same short story, but the students imagine its main character differently. One reader trusts the narrator, while another notices details that suggest the narrator is hiding something. They return to the text and compare evidence from dialogue, action and description. Then they rewrite one scene from another character's point of view. The event remains the same, but the mood and meaning change. The activity shows them that literature invites readers to interpret, question and connect ideas.",
        factual:
          "Literature includes poetry, drama, novels, short stories and other crafted forms of language. Writers shape meaning through plot, character, narrator, imagery, metaphor, rhythm and structure. Fiction is invented, yet it can explore real emotions, choices and social issues. A literary interpretation should be supported by details from the text rather than personal opinion alone. Readers may reach different conclusions when each can explain the evidence. Publishing also involves drafting, editing, design and decisions about audience.",
      },
      {
        fiction:
          "Two groups must solve a building challenge, but they cannot speak to each other. At first, gestures and drawings create several misunderstandings. One student develops a simple set of symbols for size, direction and order. The teams begin to collaborate more successfully, although one gesture still has a different meaning for each group. During the review, they discuss how tone, facial expression, culture and context affect a message. Clear communication requires both expressing an idea and checking how it was understood.",
        factual:
          "Communication can be verbal, non-verbal, written, visual or digital. A message passes through a medium and is interpreted by an audience. Noise is anything that interferes, including poor sound, unclear language, distraction or different assumptions. Effective communicators consider purpose, choose a suitable form and invite feedback. Persuasion aims to influence beliefs or actions, so responsible speakers separate evidence from exaggeration. Online messages can travel quickly and remain available, making accuracy, privacy and respectful behaviour especially important.",
      },
      {
        fiction:
          "An artisan teaches Linh to make a small wooden bookmark. Linh measures the wood, smooths the edges with a file and carves a simple pattern. Her first line is uneven because she pushes the tool too hard. She slows down, changes her grip and practises on spare wood. Finally, she polishes the bookmark and gives it to her teacher. The object is small, but it carries time, skill and decisions that cannot be seen in a factory-made copy.",
        factual:
          "Handmade objects are shaped directly by tools, materials and human skill. Wood may be cut, joined, carved and polished; fabric may be measured, sewn or knitted; clay may be formed and heated. Material properties determine which tools and techniques are safe. A craftsperson plans the order of steps because one mistake can affect later work. Handmade production is usually slower than mass manufacture, but it allows repair, variation and cultural designs. Safe practice includes stable work surfaces, protective equipment and careful tool storage.",
      },
      {
        fiction:
          "A student enters a triathlon after months of training. She swims well but loses time during the cycling section when a chain slips. For a moment, she wants to stop. Her partner reminds her that the goal is to finish safely and learn from the race. She repairs the chain, adjusts her pace and completes the final run. Her result is not the fastest, yet she feels proud because preparation, problem-solving and confidence carried her through an unexpected challenge.",
        factual:
          "Sport can improve strength, endurance, coordination and emotional wellbeing. Different activities place different demands on the body, so training should match the event and increase gradually. Recovery, sleep, hydration and nutrition are part of performance rather than time away from it. Competition can motivate athletes, but rules and officials protect fairness and safety. Team members may have separate roles while sharing one purpose. Participation also brings social benefits when players respect opponents and measure progress against realistic personal goals.",
      },
      {
        fiction:
          "A coastal town receives a warning that a powerful storm may arrive. Some residents focus on protecting buildings, while others prepare food, water and emergency communication. Students help map safe routes for older neighbours. The storm changes direction, but the town still reviews its plan. They discover that one shelter lacks supplies and one road could flood quickly. Preparing for an event that did not happen was not wasted effort; the information makes the community safer for the next emergency.",
        factual:
          "Extreme weather includes heatwaves, droughts, floods, blizzards, hurricanes and other unusually severe conditions. Global warming raises average temperatures and can influence rainfall, sea level and the likelihood of some extremes. Scientists study long-term records because one storm alone does not prove a climate trend. Risk depends on both the hazard and a community's exposure and preparation. Forecasts, strong infrastructure, early warnings and evacuation plans reduce harm, while cutting greenhouse gas emissions addresses an important cause of future change.",
      },
      {
        fiction:
          "For a science project, a class compares three ways of cooking the same vegetable. They boil one piece, steam another and fry the third. The students measure texture, colour and mass, then taste small samples. They expected the fried piece to be everyone's favourite, but opinions differ. Their report explains that cooking changes food through heat and water, and that a fair test controls the size and cooking time. The class turns a familiar meal into careful investigation.",
        factual:
          "Cooking changes ingredients physically and chemically. Heat can soften plant cells, melt fat, evaporate water and create new flavours. Boiling transfers heat through water, steaming uses hot vapour, and frying transfers heat through oil. Safe cooks prevent cross-contamination, keep raw food separate and check suitable temperatures. Digestion later breaks food into nutrients the body can absorb. Recipes provide a sequence, but experienced cooks also observe colour, smell and texture when deciding whether food is ready.",
      },
      {
        fiction:
          "Minh studies hard for a test by reading the same page many times, but he cannot remember the ideas the next day. He changes his plan: he closes the book, writes what he knows, checks mistakes and explains the topic to a friend. He also spreads practice across several days and sleeps properly. His score improves, but the greater change is confidence. Minh now understands that learning is active work, and that difficulty during practice can help memory grow stronger.",
        factual:
          "Learning changes the brain through attention, connection, practice and retrieval. Repetition is useful when it requires the learner to recall or apply information rather than only look at it again. Spaced practice strengthens memory more effectively than one long session, while feedback helps correct errors before they become habits. Clear goals make progress measurable. Different subjects may need different strategies, including examples, diagrams, discussion or physical rehearsal. Reflection helps learners choose methods, monitor results and adjust their plan independently.",
      },
    ],
  };

  Object.entries(readings).forEach(([gradeKey, gradeReadings]) => {
    const grade = Number(gradeKey);
    gradeReadings.forEach((reading, unitIndex) => {
      const unit = curriculum[grade]?.units?.[unitIndex];
      if (!unit) return;
      unit.originalReadings = {
        fictionTitle:
          grade === 2 && unit.readingTitles?.[0]
            ? `Milo Reading 1 · ${unit.readingTitles[0]}`
            : reading.fictionTitle || "Reading 1 · Fiction & Values",
        fiction: reading.fiction,
        factualTitle:
          grade === 2 && unit.readingTitles?.[1]
            ? `Milo Reading 2 · ${unit.readingTitles[1]}`
            : reading.factualTitle || "Reading 2 · Factual & CLIL",
        factual: reading.factual,
        authorship:
          grade === 2
            ? "Nội dung Milo tự biên soạn theo Big Question và mục tiêu đã đối chiếu; không phải nguyên văn bài đọc sách."
            : "Milo original content aligned to the Now I Know Big Question and level objectives.",
      };
    });
  });
})();
