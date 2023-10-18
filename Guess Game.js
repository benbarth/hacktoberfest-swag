<!DOCTYPE html>
<html>
<head>
    <title>Guess the Number Game</title>
</head>
<body>
    <h1>Guess the Number Game</h1>
    <p>Try to guess the random number between 1 and 100.</p>
    <input type="text" id="guessInput">
    <input type="submit" value="Submit Guess" id="guessButton">
    <p class="message" id="message"></p>

    <script>
        // Generate a random number between 1 and 100
        const randomNumber = Math.floor(Math.random() * 100) + 1;

        // Initialize variables
        let attempts = 0;
        const maxAttempts = 10;
        const message = document.getElementById("message");
        const guessInput = document.getElementById("guessInput");
        const guessButton = document.getElementById("guessButton");

        // Function to check the player's guess
        function checkGuess() {
            const userGuess = Number(guessInput.value);
            attempts++;

            if (userGuess === randomNumber) {
                message.textContent = `Congratulations! You guessed the number in ${attempts} attempts. The number was ${randomNumber}.`;
                message.style.color = "green";
                guessInput.disabled = true;
                guessButton.disabled = true;
            } else if (attempts === maxAttempts) {
                message.textContent = `Game over! You've used all your attempts. The number was ${randomNumber}.`;
                message.style.color = "red";
                guessInput.disabled = true;
                guessButton.disabled = true;
            } else {
                const hint = userGuess < randomNumber ? "higher" : "lower";
                message.textContent = `Wrong guess! Try a ${hint} number. Attempts left: ${maxAttempts - attempts}`;
                message.style.color = "black";
                guessInput.value = "";
                guessInput.focus();
            }
        }

        // Event listener for the guess button
        guessButton.addEventListener("click", checkGuess);

        // Focus on the input field when the page loads
        guessInput.focus();
    </script>
</body>
</html>
