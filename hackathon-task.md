# Task Topic: "Empty Run Buster" – Hunting for the Empty Run

## **Problem:**

Significant costs for Ukrzaliznytsia are incurred by the movement of empty wagons after unloading before their next loading. Situations arise where an empty wagon travels a long distance (e.g., from Lviv to Dnipro), even though a client right nearby (in Vinnytsia) needs that wagon immediately. The lack of operational redistribution leads to "idle" runs, track wear, excessive fuel consumption, and untimely provision of rolling stock to shippers.

## **Goal:**

Create a "smart distribution" system for the fleet of empty freight wagons that analyzes shipper requests and distributes the fleet along the shortest path of supply, thereby reducing total empty mileage.

### Input Data for Modeling:

- Fleet: 300 gondola cars (open wagons), 100 grain hoppers, 50 cement hoppers.
- Number of Virtual Stations: 25.
- Classification of Stations: 2 sorting stations, 2 border crossings, 2 port-related freight stations, 19 standard freight stations.
- Cargo Types: Ore (gondolas), Crushed stone (gondolas), Grain (grain hoppers), Cement (cement hoppers).

Economic Indicators:

- Cost of 1 km of empty run (nominal): 20 UAH (fuel, track wear, labor).
- Profit from 1 km of loaded run (nominal): 30 UAH.
- Time Losses: Every extra day in transit without cargo is lost profit.
- Technical Constraints: Terms of providing wagons to the client according to submitted requests and in the required quantity.

> **Note:** The provided input data is a base for modeling. Teams must independently model the operational situation (station locations, cargo flows, wagon movement logic, etc.). The 25 virtual stations can be chosen and placed at the teams' discretion across Ukraine (considering the logic of the transport network, existing cargo flows, ports, border crossings, etc.). Simplification or generalization of real processes is allowed if it helps demonstrate the logic of the proposed solution.

### Functional Modules to be Processed:

- Matching Algorithm: The logic by which the system chooses which specific empty wagon out of dozens to send to a particular client.
- Client Interface Prototype: Displaying the wagon number and estimated arrival time.

### Expected Result:

- Professional Solution: A flow redirection map or a logical distribution algorithm demonstrating maximum efficiency in using empty rolling stock and reducing empty mileage.
- Presentation: Project defense (5–7 mins) with an emphasis on the financial benefit for the company.
- Proof of Viability (Additional Advantage): An implementation roadmap (stages of integration with the Automated Freight Transport Management System).
- Analysis: Resource analysis, risk assessment (changes in client plans, deficit of certain wagon types), and SWOT analysis.
- Justification: Economic reasoning for reducing the cost of transportation.

### Evaluation Criteria:

- Innovation (25 points): Novelty of the solution, implementation potential, scalability.
- Professional Depth (25 points): The extent to which the task is solved according to the participants' specialization.
- Project Viability (25 points): How realistic and technically possible the idea is, and the real benefit to the company.
- Sprint Challenge – Teamwork (25 points): Speed, conciseness, creativity, and participant engagement.

### Advice:

Think like a business owner: every kilometer an empty wagon travels is money flying out the window. Try to find a solution where the wagon is always "busy" working. Your task is to ensure no wagon passes by a client who needs it. Try to create an "interception" algorithm that automatically sees a free wagon within a radius of 100–200 km from a new request.
