# TriEV WhatsApp CRM & RSA Bot (Prototype)

## Project Overview
This project is a Node.js/Express prototype for a WhatsApp-based Customer Relationship Management (CRM) and Roadside Assistance (RSA) system for TriEV, a 2W EV fleet operator. 

It uses the Gupshup WhatsApp API for conversational interactions and connects to Google Sheets/AppSheet as the database and CRM frontend.

## The Objective
To create an interactive WhatsApp bot that replaces manual RSA ticket logging. When a rider needs help, the bot will automatically collect their issue details step-by-step and log it into the CRM for the tech team.

## Conversational Workflow
1. **Trigger:** The rider sends a message containing the word "help".
2. **Greeting & Identification:** The bot acknowledges the rider and asks for their `Chassis` number to identify the vehicle.
3. **Issue Categorization:** The bot provides an interactive list or buttons asking for the `Issue Category` (e.g., Battery, Motor, Tires).
4. **Context Gathering:** The bot asks for a brief `Issue Note` describing the problem.
5. **Location Gathering:** The bot asks for the rider's `Region` and exact `Location`.
6. **Confirmation & CRM Sync:** - The bot generates a `Ticket ID`.
    - It saves all gathered data (including `Calling Mobile No`) to the AppSheet database.
    - It sends a bilingual (English/Hindi) confirmation message back to the rider.
    - It sends an alert to the TriEV technician WhatsApp group.

## Data Structure (Based on AppSheet Backend)
The bot must collect and format the following data points to sync with the CRM:
- `ticketId` (Generated)
- `ticketDate` (Timestamp)
- `riderMobile` (Extracted from Gupshup payload)
- `callingMobileNo`
- `chassis`
- `region`
- `location`
- `issueCategory`
- `issueNote`

## Bilingual Output Requirement
Confirmation messages sent to the rider must include Hindi translations for accessibility, matching standard TriEV communications (e.g., "Your RSA ticket is logged successfully (धन्यवाद! आपका आरएसए टिकट सफलतापूर्वक दर्ज किया गया है)").

## Tech Stack
- **Server:** Node.js, Express.js
- **WhatsApp API:** Gupshup
- **Database/CRM:** Google Sheets connected to Google AppSheet
- **Hosting:** Render (Expected)
