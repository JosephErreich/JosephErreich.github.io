const StonecrestGreen = "#295356";
const StonecrestGrey = "#E0EAF6";

document.body.style.backgroundColor = StonecrestGreen;
document.body.style.color = StonecrestGrey;
document.querySelectorAll('button').forEach(btn => {
    btn.style.backgroundColor = StonecrestGrey;
    btn.style.color = StonecrestGreen;
});

function toggleFields(prefix) {
    const decimal = document.getElementById(`${prefix}_decimal`);
    const inch = document.getElementById(`${prefix}_inch`);
    const fraction = document.getElementById(`${prefix}_fraction`);

    if (decimal.value) {
        inch.disabled = true;
        fraction.disabled = true;
    } else if (inch.value || fraction.value) {
        decimal.disabled = true;
    } else {
        decimal.disabled = false;
        inch.disabled = false;
        fraction.disabled = false;
    }
}

function decimalToFraction(decimal) {
    if (!decimal) return "0";
    const frac = new Fraction(decimal);
    const integer = Math.floor(decimal);
    const remainder = decimal - integer;
    if (remainder === 0) return `${integer}`;
    return `${integer} ${frac.n}/${frac.d}`.trim();
}

function parseFraction(fractionStr) {
    if (!fractionStr) return 0;
    try {
        const frac = new Fraction(fractionStr);
        return frac.valueOf();
    } catch (e) {
        return 0; // Invalid fraction defaults to 0
    }
}

function processForm(event) {
    event.preventDefault();

    // Validate inputs
    const inputs = document.querySelectorAll('input');
    for (let input of inputs) {
        if (input.pattern && input.value && !new RegExp(`^${input.pattern}$`).test(input.value)) {
            alert(`Invalid input in ${input.id}: ${input.title}`);
            return;
        }
    }

    // Get input values
    const depthDecimal = parseFloat(document.getElementById('depth_decimal').value) || 0;
    const depthInch = parseFloat(document.getElementById('depth_inch').value) || 0;
    const depthFraction = parseFraction(document.getElementById('depth_fraction').value);
    const widthDecimal = parseFloat(document.getElementById('width_decimal').value) || 0;
    const widthInch = parseFloat(document.getElementById('width_inch').value) || 0;
    const widthFraction = parseFraction(document.getElementById('width_fraction').value);
    const webDecimal = parseFloat(document.getElementById('web_thickness_decimal').value) || 0;
    const webInch = parseFloat(document.getElementById('web_thickness_inch').value) || 0;
    const webFraction = parseFraction(document.getElementById('web_thickness_fraction').value);
    const flangeDecimal = parseFloat(document.getElementById('flange_thickness_decimal').value) || 0;
    const flangeInch = parseFloat(document.getElementById('flange_thickness_inch').value) || 0;
    const flangeFraction = parseFraction(document.getElementById('flange_thickness_fraction').value);

    const depthInput = depthDecimal || (depthInch + depthFraction);
    const widthInput = widthDecimal || (widthInch + widthFraction);
    const webInput = webDecimal || (webInch + webFraction);
    const flangeInput = flangeDecimal || (flangeInch + flangeFraction);

    const depthIsFraction = !depthDecimal && (depthInch || depthFraction);
    const widthIsFraction = !widthDecimal && (widthInch || widthFraction);
    const webIsFraction = !webDecimal && (webInch || webFraction);
    const flangeIsFraction = !flangeDecimal && (flangeInch || flangeFraction);

    // Fetch data from W_Shape_Data.json
    fetch('W_Shape_Data.json')
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            return response.json();
        })
        .then(data => {
            const depthData = depthIsFraction ? data.map(row => row.Depth_Fraction) : data.map(row => row.Depth_Decimal);
            const widthData = widthIsFraction ? data.map(row => row.Width_Fraction) : data.map(row => row.Width_Decimal);
            const webData = webIsFraction ? data.map(row => row.Web_Fraction) : data.map(row => row.Web_Decimal);
            const flangeData = flangeIsFraction ? data.map(row => row.Flange_Fraction) : data.map(row => row.Flange_Decimal);
            const nameData = data.map(row => row.Name);

            let depthMatches = depthInput ? data.map((row, i) => [i, Math.abs(depthData[i] - depthInput)]).filter(d => d[1] <= 1).sort((a, b) => a[1] - b[1]).slice(0, 20) : data.map((_, i) => [i, 0]);
            let widthMatches = widthInput ? depthMatches.map(([i, _]) => [i, Math.abs(widthData[i] - widthInput)]).filter(w => w[1] <= 1).sort((a, b) => a[1] - b[1]).slice(0, 15) : depthMatches;
            let webMatches = webInput ? widthMatches.map(([i, _]) => [i, Math.abs(webData[i] - webInput)]).filter(w => w[1] <= 1).sort((a, b) => a[1] - b[1]).slice(0, 10) : widthMatches;
            let flangeMatches = flangeInput ? webMatches.map(([i, _]) => [i, Math.abs(flangeData[i] - flangeInput)]).filter(f => f[1] <= 1).sort((a, b) => a[1] - b[1]).slice(0, 5) : webMatches.slice(0, 5);

            const results = flangeMatches.map(([idx]) => ({
                name: nameData[idx],
                depth: depthData[idx],
                width: widthData[idx],
                web: webData[idx],
                flange: flangeData[idx]
            }));

            // Format display values
            const depthDisplay = depthInput ? (depthIsFraction ? decimalToFraction(depthInput) : depthInput) : "0";
            const widthDisplay = widthInput ? (widthIsFraction ? decimalToFraction(widthInput) : widthInput) : "0";
            const webDisplay = webInput ? (webIsFraction ? decimalToFraction(webInput) : webInput) : "0";
            const flangeDisplay = flangeInput ? (flangeIsFraction ? decimalToFraction(flangeInput) : flangeInput) : "0";

            const formattedResults = results.map(r => ({
                name: r.name,
                depth: depthIsFraction ? decimalToFraction(r.depth) : r.depth,
                width: widthIsFraction ? decimalToFraction(r.width) : r.width,
                web: webIsFraction ? decimalToFraction(r.web) : r.web,
                flange: flangeIsFraction ? decimalToFraction(r.flange) : r.flange
            }));

            // Display results
            document.getElementById('results').style.display = 'block';
            document.getElementById('measuredTable').innerHTML = `
                <tr><th>Name</th><th>Depth</th><th>Width</th><th>Web Thickness</th><th>Flange Thickness</th></tr>
                <tr><td>TBD</td><td>${depthDisplay}</td><td>${widthDisplay}</td><td>${webDisplay}</td><td>${flangeDisplay}</td></tr>
            `;
            document.getElementById('closestTable').innerHTML = `
                <tr><th>Name</th><th>Depth</th><th>Width</th><th>Web Thickness</th><th>Flange Thickness</th></tr>
                <tr><td>${formattedResults[0]?.name || "No Results"}</td><td>${formattedResults[0]?.depth || "N/A"}</td><td>${formattedResults[0]?.width || "N/A"}</td><td>${formattedResults[0]?.web || "N/A"}</td><td>${formattedResults[0]?.flange || "N/A"}</td></tr>
            `;
            document.getElementById('othersTable').innerHTML = formattedResults.slice(1).map(r => `
                <tr><td>${r.name}</td><td>${r.depth}</td><td>${r.width}</td><td>${r.web}</td><td>${r.flange}</td></tr>
            `).join('') || '<tr><td colspan="5">No other matches</td></tr>';
        })
        .catch(error => {
            console.error("Fetch error:", error);
            alert("Error loading data: " + error.message);
        });
}

function resetForm() {
    document.getElementById('measurementForm').reset();
    document.getElementById('results').style.display = 'none';
    document.querySelectorAll('input').forEach(input => input.disabled = false);
}