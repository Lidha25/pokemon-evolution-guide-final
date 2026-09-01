/* =========================================================
   POKÉMON EVOLUTION GUIDE
   Designed for the supplied pokemon.csv dataset
========================================================= */


/* =========================================================
   GLOBAL VARIABLES
========================================================= */

let pokemonData = [];


/* =========================================================
   CSV COLUMN NAMES USED IN YOUR DATASET
========================================================= */

const STAT_COLUMNS = [
    "hp",
    "attack",
    "defense",
    "special_attack",
    "special_defense",
    "speed"
];


/* =========================================================
   LOAD CSV
========================================================= */

async function loadPokemonData() {

    const loadingMessage = document.getElementById("loadingMessage");
    const errorMessage = document.getElementById("errorMessage");

    try {

        const response = await fetch("pokemon.csv");

        if (!response.ok) {
            throw new Error("Could not load pokemon.csv");
        }

        const csvText = await response.text();

        pokemonData = parseCSV(csvText);

        if (pokemonData.length === 0) {
            throw new Error("The CSV file does not contain any Pokémon.");
        }

        loadingMessage.textContent =
            `${pokemonData.length} Pokémon loaded successfully.`;

        populatePokemonList();

        /*
         * Automatically show Bulbasaur when the page loads.
         * You can remove this section if you prefer an empty page.
         */
        const searchInput = document.getElementById("pokemonSearch");

        searchInput.value = "bulbasaur";

        showPokemon("bulbasaur");

    } catch (error) {

        console.error(error);

        loadingMessage.textContent = "";

        errorMessage.textContent =
            "Unable to load Pokémon data. Please make sure pokemon.csv is in the same folder as index.html.";

    }
}


/* =========================================================
   CSV PARSER
========================================================= */

function parseCSV(csvText) {

    const rows = [];
    let row = [];
    let cell = "";
    let insideQuotes = false;

    for (let i = 0; i < csvText.length; i++) {

        const character = csvText[i];
        const nextCharacter = csvText[i + 1];


        if (character === '"' && nextCharacter === '"') {

            cell += '"';
            i++;

        } else if (character === '"') {

            insideQuotes = !insideQuotes;

        } else if (character === "," && !insideQuotes) {

            row.push(cell.trim());
            cell = "";

        } else if (
            (character === "\n" || character === "\r") &&
            !insideQuotes
        ) {

            if (character === "\r" && nextCharacter === "\n") {
                i++;
            }

            row.push(cell.trim());
            cell = "";

            if (row.some(value => value !== "")) {
                rows.push(row);
            }

            row = [];

        } else {

            cell += character;

        }
    }


    if (cell !== "" || row.length > 0) {

        row.push(cell.trim());

        if (row.some(value => value !== "")) {
            rows.push(row);
        }
    }


    if (rows.length < 2) {
        return [];
    }


    const headers = rows[0];

    return rows.slice(1).map(values => {

        const pokemon = {};

        headers.forEach((header, index) => {

            pokemon[header.trim()] =
                values[index] !== undefined
                    ? values[index].trim()
                    : "";

        });

        return pokemon;

    });

}


/* =========================================================
   CREATE SEARCH SUGGESTIONS
========================================================= */

function populatePokemonList() {

    const datalist = document.getElementById("pokemonList");

    datalist.innerHTML = "";

    pokemonData.forEach(pokemon => {

        const option = document.createElement("option");

        option.value = pokemon.pokemon;

        datalist.appendChild(option);

    });

}


/* =========================================================
   FIND POKÉMON
========================================================= */

function findPokemon(searchName) {

    const name = searchName
        .trim()
        .toLowerCase();


    return pokemonData.find(pokemon =>
        pokemon.pokemon.toLowerCase() === name
    );

}


/* =========================================================
   GET NEXT EVOLUTION
========================================================= */

function getNextEvolution(currentPokemon) {

    const currentSpeciesId =
        String(currentPokemon.species_id);


    /*
     * In your CSV:
     *
     * evolves_from_species_id
     *
     * contains the species_id of the previous Pokémon.
     *
     * Therefore, to find the next evolution we search for
     * Pokémon whose evolves_from_species_id equals the
     * current species_id.
     */

    return pokemonData.filter(pokemon =>
        String(pokemon.evolves_from_species_id) === currentSpeciesId
    );

}


/* =========================================================
   GET EVOLUTION CHAIN
========================================================= */

function getEvolutionChain(currentPokemon) {

    const chainId =
        String(currentPokemon.evolution_chain_id);


    return pokemonData
        .filter(pokemon =>
            String(pokemon.evolution_chain_id) === chainId
        )
        .sort((a, b) =>
            Number(a.species_id) - Number(b.species_id)
        );

}


/* =========================================================
   CALCULATE BASE STAT TOTAL
========================================================= */

function calculateBST(pokemon) {

    return STAT_COLUMNS.reduce((total, stat) => {

        return total + Number(pokemon[stat] || 0);

    }, 0);

}


/* =========================================================
   IMAGE URL
========================================================= */

function getImageUrl(pokemon) {

    /*
     * Your CSV contains values such as:
     *
     * 1.png
     * 2.png
     * 3.png
     *
     * We use the Pokémon ID with the official
     * PokeAPI sprite repository.
     */

    const id = Number(pokemon.id);

    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;

}


/* =========================================================
   FORMAT POKÉMON NAME
========================================================= */

function formatName(name) {

    if (!name) {
        return "";
    }

    return name
        .split("-")
        .map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        )
        .join(" ");

}


/* =========================================================
   DISPLAY POKÉMON
========================================================= */

function showPokemon(searchName) {

    const pokemon = findPokemon(searchName);

    const errorMessage =
        document.getElementById("errorMessage");

    const results =
        document.getElementById("results");


    if (!pokemon) {

        results.classList.add("hidden");

        errorMessage.textContent =
            `Pokémon "${searchName}" was not found. Please choose a Pokémon from the list.`;

        return;
    }


    errorMessage.textContent = "";

    results.classList.remove("hidden");


    displayPokemonInformation(pokemon);

    displayEvolutionChain(pokemon);

    displayRecommendation(pokemon);

}


/* =========================================================
   DISPLAY BASIC INFORMATION
========================================================= */

function displayPokemonInformation(pokemon) {

    const pokemonImage =
        document.getElementById("pokemonImage");

    const pokemonName =
        document.getElementById("pokemonName");

    const pokemonId =
        document.getElementById("pokemonId");


    pokemonName.textContent =
        formatName(pokemon.pokemon);


    pokemonId.textContent =
        `#${String(pokemon.id).padStart(3, "0")}`;


    pokemonImage.src =
        getImageUrl(pokemon);


    pokemonImage.alt =
        formatName(pokemon.pokemon);


    /*
     * Image fallback
     */

    pokemonImage.onerror = function () {

        this.onerror = null;

        this.src = "https://via.placeholder.com/280?text=No+Image";

    };


    displayTypes(pokemon);

    displayStats(pokemon);

}


/* =========================================================
   DISPLAY TYPES
========================================================= */

function displayTypes(pokemon) {

    const typesContainer =
        document.getElementById("pokemonTypes");


    typesContainer.innerHTML = "";


    if (pokemon.type_1 &&
        pokemon.type_1.toLowerCase() !== "na") {

        addTypeBadge(
            pokemon.type_1,
            typesContainer
        );

    }


    if (pokemon.type_2 &&
        pokemon.type_2.toLowerCase() !== "na") {

        addTypeBadge(
            pokemon.type_2,
            typesContainer
        );

    }

}


/* =========================================================
   TYPE BADGE
========================================================= */

function addTypeBadge(type, container) {

    const badge =
        document.createElement("span");

    badge.className = "type";

    badge.textContent = type;

    badge.style.background =
        getTypeColor(type);


    container.appendChild(badge);

}


/* =========================================================
   TYPE COLORS
========================================================= */

function getTypeColor(type) {

    const colors = {

        normal: "#A8A878",
        fire: "#F08030",
        water: "#6890F0",
        electric: "#F8D030",
        grass: "#78C850",
        ice: "#98D8D8",
        fighting: "#C03028",
        poison: "#A040A0",
        ground: "#E0C068",
        flying: "#A890F0",
        psychic: "#F85888",
        bug: "#A8B820",
        rock: "#B8A038",
        ghost: "#705898",
        dragon: "#7038F8",
        dark: "#705848",
        steel: "#B8B8D0",
        fairy: "#EE99AC"

    };


    return colors[type.toLowerCase()] || "#777";

}


/* =========================================================
   DISPLAY STATS
========================================================= */

function displayStats(pokemon) {

    const stats = {

        hp: Number(pokemon.hp || 0),

        attack: Number(pokemon.attack || 0),

        defense: Number(pokemon.defense || 0),

        specialAttack:
            Number(pokemon.special_attack || 0),

        specialDefense:
            Number(pokemon.special_defense || 0),

        speed:
            Number(pokemon.speed || 0)

    };


    setStat(
        "hp",
        stats.hp
    );


    setStat(
        "attack",
        stats.attack
    );


    setStat(
        "defense",
        stats.defense
    );


    setStat(
        "specialAttack",
        stats.specialAttack
    );


    setStat(
        "specialDefense",
        stats.specialDefense
    );


    setStat(
        "speed",
        stats.speed
    );


    document.getElementById("bstValue").textContent =
        calculateBST(pokemon);

}


/* =========================================================
   SET STAT BAR
========================================================= */

function setStat(statName, value) {

    const valueElement =
        document.getElementById(`${statName}Value`);

    const barElement =
        document.getElementById(`${statName}Bar`);


    valueElement.textContent = value;


    /*
     * 255 is approximately the upper range
     * for base stats in the dataset.
     */

    const percentage =
        Math.min((value / 255) * 100, 100);


    barElement.style.width =
        `${percentage}%`;

}


/* =========================================================
   DISPLAY EVOLUTION CHAIN
========================================================= */

function displayEvolutionChain(pokemon) {

    const container =
        document.getElementById("evolutionChain");


    container.innerHTML = "";


    const chain =
        getEvolutionChain(pokemon);


    if (chain.length === 0) {

        container.innerHTML =
            "<p>Evolution information is not available.</p>";

        return;
    }


    chain.forEach((evolutionPokemon, index) => {

        const item =
            document.createElement("div");

        item.className = "evolution-item";


        const image =
            document.createElement("img");

        image.src =
            getImageUrl(evolutionPokemon);

        image.alt =
            formatName(evolutionPokemon.pokemon);


        image.onerror = function () {

            this.onerror = null;

            this.src =
                "https://via.placeholder.com/120?text=No+Image";

        };


        const name =
            document.createElement("p");

        name.textContent =
            formatName(evolutionPokemon.pokemon);


        item.appendChild(image);

        item.appendChild(name);


        container.appendChild(item);


        /*
         * Add arrow between evolution stages
         */

        if (index < chain.length - 1) {

            const arrow =
                document.createElement("div");

            arrow.className =
                "evolution-arrow";

            arrow.textContent = "→";

            container.appendChild(arrow);

        }

    });

}


/* =========================================================
   RECOMMENDATION
========================================================= */

function displayRecommendation(currentPokemon) {

    const nextEvolutions =
        getNextEvolution(currentPokemon);


    const recommendation =
        document.getElementById("recommendation");

    const icon =
        document.getElementById("recommendationIcon");

    const title =
        document.getElementById("recommendationTitle");

    const text =
        document.getElementById("recommendationText");


    /*
     * CASE 1:
     * No next evolution.
     */

    if (nextEvolutions.length === 0) {

        recommendation.className =
            "recommendation no";


        icon.textContent = "🔴";


        title.textContent =
            "NO — KEEP IT";


        text.textContent =
            `${formatName(currentPokemon.pokemon)} does not have a recorded next evolution in this dataset. It may already be fully evolved.`;


        clearComparison();

        return;
    }


    /*
     * If there are multiple possible evolutions,
     * choose the one with the highest Base Stat Total.
     */

    const nextEvolution =
        nextEvolutions.reduce((best, pokemon) => {

            return calculateBST(pokemon) >
                calculateBST(best)
                ? pokemon
                : best;

        });


    const currentBST =
        calculateBST(currentPokemon);


    const nextBST =
        calculateBST(nextEvolution);


    const difference =
        nextBST - currentBST;


    const percentageIncrease =
        (difference / currentBST) * 100;


    /*
     * RECOMMENDATION RULE
     *
     * 10% or more increase:
     * YES
     *
     * 0-10% increase:
     * MAYBE
     *
     * decrease:
     * NO
     */

    if (percentageIncrease >= 10) {

        recommendation.className =
            "recommendation";


        icon.textContent = "🟢";


        title.textContent =
            "YES — EVOLVE IT!";


        text.textContent =
            `${formatName(nextEvolution.pokemon)} has a ${percentageIncrease.toFixed(1)}% higher Base Stat Total than ${formatName(currentPokemon.pokemon)}. Evolving should give you a stronger Pokémon based on the available base statistics.`;

    }

    else if (percentageIncrease > 0) {

        recommendation.className =
            "recommendation maybe";


        icon.textContent = "🟡";


        title.textContent =
            "MAYBE — CONSIDER EVOLVING";


        text.textContent =
            `${formatName(nextEvolution.pokemon)} has a slightly higher Base Stat Total (${difference} points) than ${formatName(currentPokemon.pokemon)}. The improvement is relatively small, so you may want to consider other factors before evolving.`;

    }

    else {

        recommendation.className =
            "recommendation no";


        icon.textContent = "🔴";


        title.textContent =
            "NO — KEEP IT FOR NOW";


        text.textContent =
            `${formatName(nextEvolution.pokemon)} does not have a higher Base Stat Total than ${formatName(currentPokemon.pokemon)}. Based on stats alone, evolving is not recommended.`;

    }


    displayComparison(
        currentPokemon,
        nextEvolution
    );

}


/* =========================================================
   DISPLAY STAT COMPARISON
========================================================= */

function displayComparison(
    currentPokemon,
    nextPokemon
) {

    document.getElementById(
        "currentPokemonHeader"
    ).textContent =
        formatName(currentPokemon.pokemon);


    document.getElementById(
        "nextPokemonHeader"
    ).textContent =
        formatName(nextPokemon.pokemon);


    compareStat(
        "Hp",
        currentPokemon.hp,
        nextPokemon.hp
    );


    compareStat(
        "Attack",
        currentPokemon.attack,
        nextPokemon.attack
    );


    compareStat(
        "Defense",
        currentPokemon.defense,
        nextPokemon.defense
    );


    compareStat(
        "SpecialAttack",
        currentPokemon.special_attack,
        nextPokemon.special_attack
    );


    compareStat(
        "SpecialDefense",
        currentPokemon.special_defense,
        nextPokemon.special_defense
    );


    compareStat(
        "Speed",
        currentPokemon.speed,
        nextPokemon.speed
    );


    compareStat(
        "Bst",
        calculateBST(currentPokemon),
        calculateBST(nextPokemon)
    );

}


/* =========================================================
   COMPARE INDIVIDUAL STAT
========================================================= */

function compareStat(
    statName,
    currentValue,
    nextValue
) {

    const current =
        Number(currentValue || 0);

    const next =
        Number(nextValue || 0);

    const difference =
        next - current;


    document.getElementById(
        `compare${statName}Current`
    ).textContent = current;


    document.getElementById(
        `compare${statName}Next`
    ).textContent = next;


    const changeElement =
        document.getElementById(
            `compare${statName}Change`
        );


    if (difference > 0) {

        changeElement.textContent =
            `+${difference}`;

        changeElement.className =
            "increase";

    }

    else if (difference < 0) {

        changeElement.textContent =
            `${difference}`;

        changeElement.className =
            "decrease";

    }

    else {

        changeElement.textContent =
            "0";

        changeElement.className =
            "same";

    }

}


/* =========================================================
   CLEAR COMPARISON
========================================================= */

function clearComparison() {

    const fields = [

        "compareHpCurrent",
        "compareHpNext",
        "compareHpChange",

        "compareAttackCurrent",
        "compareAttackNext",
        "compareAttackChange",

        "compareDefenseCurrent",
        "compareDefenseNext",
        "compareDefenseChange",

        "compareSpecialAttackCurrent",
        "compareSpecialAttackNext",
        "compareSpecialAttackChange",

        "compareSpecialDefenseCurrent",
        "compareSpecialDefenseNext",
        "compareSpecialDefenseChange",

        "compareSpeedCurrent",
        "compareSpeedNext",
        "compareSpeedChange",

        "compareBstCurrent",
        "compareBstNext",
        "compareBstChange"

    ];


    fields.forEach(id => {

        const element =
            document.getElementById(id);

        element.textContent = "-";

        element.className = "";

    });

}


/* =========================================================
   SEARCH BUTTON
========================================================= */

document
    .getElementById("searchButton")
    .addEventListener("click", function () {

        const searchInput =
            document.getElementById("pokemonSearch");

        const name =
            searchInput.value.trim();


        if (name === "") {

            document.getElementById(
                "errorMessage"
            ).textContent =
                "Please enter a Pokémon name.";

            return;
        }


        showPokemon(name);

    });


/* =========================================================
   ENTER KEY
========================================================= */

document
    .getElementById("pokemonSearch")
    .addEventListener("keydown", function (event) {

        if (event.key === "Enter") {

            document
                .getElementById("searchButton")
                .click();

        }

    });


/* =========================================================
   START APPLICATION
========================================================= */

loadPokemonData(); 
/* =========================================================
   FEATURED POKÉMON CARDS
========================================================= */

document
    .querySelectorAll(".featured-pokemon-card")
    .forEach(card => {

        card.addEventListener("click", function () {

            const pokemonName =
                this.dataset.pokemon;

            const searchInput =
                document.getElementById("pokemonSearch");

            searchInput.value =
                pokemonName;

            showPokemon(pokemonName);

            /*
             * Smoothly scroll to the results.
             */

            document
                .getElementById("results")
                .scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });

        });

    });
