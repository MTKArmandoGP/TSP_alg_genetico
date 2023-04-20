let coordinatesArray = [];
let puntos = [];

function onMapClick(e) {
  let marker = L.marker(e.latlng).addTo(markersLayer);
  marker.bindPopup(`Coordenadas: ${e.latlng}`).openPopup();
}


function showDistance() {
  let markers = markersLayer.getLayers();
  console.log(markers);
  let totalDistance = 0;

  for (let i = 0; i < markers.length - 1; i++) {
    let distance = markers[i]
      .getLatLng()
      .distanceTo(markers[i + 1].getLatLng());
    totalDistance += distance;
  }

  // Convierte los kilometros a Decimales
  totalDistance = (totalDistance / 1000).toFixed(2);

  let distanceText = `Distancia total entre los puntos: ${totalDistance} km`;
  document.getElementById("distance").innerHTML = distanceText;
}

function alg_Genetico() {
  //let bestIndividual2 = [];
  mutationRate = 0.2;
  let markers = markersLayer.getLayers();
  for (let i = 0; i < markers.length; i++) {
    let arrayAux = [];
    for (let j = 0; j < markers.length; j++) {
      arrayAux.push(
        markers[i].getLatLng().distanceTo(markers[j].getLatLng()) //calcula las distancias
      );
    }
    puntos.push(arrayAux);
  }
  //algoritmo genetico
  const populationSize = 50; //Es la poblacion la cual va a generar
  const maxGenerations = 10000;
  // Definir la función de fitness para evaluar cada ruta
  //Regresara la que tenga el mayor valor pero como buscamos el menor
  //al final se saca un numero reciproco
  function fitness(route) {
    let totalDistance = 0;
    for (let i = 0; i < route.length - 1; i++) {
      const pointA = route[i]; //Va tomando dos puntos para calcular la distancia
      const pointB = route[i + 1];
      totalDistance += puntos[pointA][pointB];
    }
    return 1 / totalDistance;
  }
  // Definir la función de cruzamiento para crear nuevos individuos
  function crossover(parent1, parent2) {
    const randomNumber = Math.random();//Si puede pasar el funcionamiento
    if (randomNumber < 0.2) { //Tasa de probabilidad
      const cutIndex = Math.floor(Math.random() * parent1.length);//punto de corte
      const child1 = parent1.slice(0, cutIndex);
      const child2 = parent2.slice(0, cutIndex);
      for (const city of parent2) {
        if (!child1.includes(city)) {
          child1.push(city);
        }
      }
      for (const city of parent1) {
        if (!child2.includes(city)) {
          child2.push(city);
        }
      }
      const mutatedChild1 = mutate(child1);
      const mutatedChild2 = mutate(child2);
      return [mutatedChild1, mutatedChild2];
    } else {
      return [parent1.slice(), parent2.slice()];//regresa los dos padres
    }
  }

  // Definir la función de mutación para modificar aleatoriamente un individuo
  function mutate(individual) {
    // Verificar si se produce una mutación basada en la tasa de mutación
    if (Math.random() < mutationRate) {
      const indexA = Math.floor(Math.random() * individual.length);
      let indexB = Math.floor(Math.random() * individual.length);

      while (indexB === indexA) {
        indexB = Math.floor(Math.random() * individual.length);
      }
      const temp = individual[indexA];
      individual[indexA] = individual[indexB];
      individual[indexB] = temp;
    }
    return individual;
  }

  // Crear la población inicial de manera aleatoria
  let population = [];
  for (let i = 0; i < populationSize; i++) {
    const route = [];
    for (let j = 0; j < puntos.length; j++) {
      route.push(j);
    }
    population.push(route.sort(() => Math.random() - 0.5));
  }
  // Ejecutar el algoritmo genético
  let bestFitness = 0;
  let bestRoute = null;
  for (let generation = 0; generation < maxGenerations; generation++) {
    // Evaluar la población actual
    const fitnessValues = population.map(fitness);

    // Encontrar los mejores individuos de la población
    const bestIndex = fitnessValues.indexOf(Math.max(...fitnessValues));
    const bestIndividual = population[bestIndex];
    if (bestIndex == 0) {
      bestIndividual2 = population[bestIndex + 1];
    } else {
      bestIndividual2 = population[bestIndex - 1];
    }

    const bestIndividualFitness = fitnessValues[bestIndex];
    if (bestIndividualFitness > bestFitness) {
      bestFitness = bestIndividualFitness;
      bestRoute = bestIndividual;
    }

    // Crear la próxima generación
    const newPopulation = [bestIndividual];
    while (newPopulation.length < populationSize) {
      // Implementar la selección por torneo
      const tournamentSize = 5;
      let tournament = [];
      for (let i = 0; i < tournamentSize; i++) {
        const randomIndex = Math.floor(Math.random() * population.length);
        tournament.push(population[randomIndex]);
      }
      const parent1 = tournament.reduce((prev, current) =>
        fitness(prev) > fitness(current) ? prev : current
      );
      tournament = [];
      for (let i = 0; i < tournamentSize; i++) {
        const randomIndex = Math.floor(Math.random() * population.length);
        tournament.push(population[randomIndex]);
      }
      const parent2 = tournament.reduce((prev, current) =>
        fitness(prev) > fitness(current) ? prev : current
      );

      if (parent1 == null || parent2 == null) window.location.reload();
      const [child1, child2] = crossover(parent1, parent2);

      // Evaluar el fitness de los padres y los hijos
      const individuals = [parent1, parent2, child1, child2];
      const fitnessValues = individuals.map(fitness);// funcion que va a ordenar con el map

      // Ordenar los individuos en orden descendente según su fitness
      const sortedIndividuals = individuals
        .map((individual, index) => ({
          individual,
          fitnessValue: fitnessValues[index],
        }))
        .sort((a, b) => b.fitnessValue - a.fitnessValue)
        .map((item) => item.individual);

      newPopulation.push(sortedIndividuals[0], sortedIndividuals[1]);
    }
    population = newPopulation;
  }

  let datas = [];
  if (bestRoute != null) {
    for (let i = 0; i < bestRoute.length; i++) {
      let aux = [
        coordinatesArray[bestRoute[i]][0],
        coordinatesArray[bestRoute[i]][1],
      ];
      datas.push(aux);
    }
    // Agregar primera coordenada al final del array para cerrar el circuito
    datas.push(datas[0]);

    var ruta = L.polyline(datas, { color: "red" }).addTo(map);
  } else {
    window.location.reload();
  }
}

//SCRIPT PARA MOSTRAR EL MAPA EN LA INTERFAZ

let map = L.map("mi_mapa").setView([20.12743, -98.7319], 17);

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);

let markersLayer = L.featureGroup().addTo(map);

map.on("click", function (e) {
  let marker = L.marker(e.latlng).addTo(markersLayer);
  marker.bindPopup(`Coordenadas: ${e.latlng}`).openPopup();
  coordinatesArray.push([e.latlng.lat, e.latlng.lng]);
});

function getMarkers() {
  let markers = markersLayer.getLayers();
  let coordinates = markers.map((marker) => marker.getLatLng().toString());
  alert(`Coordenadas de los puntos marcados:\n${coordinates.join("\n")}`);
}
