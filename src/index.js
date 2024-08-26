const { exec } = require("child_process");
const { performance } = require("perf_hooks");
const readline = require("readline");

const addresses = [
  "panel.tensolite.com",
  "www.tensolite.com",
  "proveedores.tensolite.com",
];

const packetCount = 100; // Aumenta el número de paquetes a 100
const timeout = 30000;  // Timeout en milisegundos

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function pingAddress(address) {
  return new Promise((resolve, reject) => {
    const command = `ping ${address} -n ${packetCount} -w ${timeout}`;
    const start = performance.now();

    exec(command, (error, stdout, stderr) => {
      if (error) {
        return reject(`Error: ${stderr || error.message}`);
      }

      const duration = performance.now() - start;
      const lines = stdout.split("\n");
      const statsLine = lines.find((line) => line.includes("Packets:"));

      const result = {
        addr: address,
        packetsSent: packetCount,
        packetsRecv: 0,
        packetLoss: 100,
        minRtt: Infinity,
        avgRtt: 0,
        maxRtt: -Infinity,
      };

      if (statsLine) {
        const packetLossMatch = statsLine.match(/Lost = (\d+)/);
        if (packetLossMatch) {
          const lost = parseInt(packetLossMatch[1], 10);
          result.packetsRecv = packetCount - lost;
          result.packetLoss = (lost / packetCount) * 100;
        }

        const times = stdout.match(/time=(\d+)ms/g) || [];
        times.forEach((timeStr) => {
          const time = parseFloat(
            timeStr.replace("time=", "").replace("ms", "")
          );
          if (time < result.minRtt) result.minRtt = time;
          if (time > result.maxRtt) result.maxRtt = time;
          result.avgRtt += time;
        });

        if (result.packetsRecv > 0) {
          result.avgRtt /= result.packetsRecv;
        } else {
          result.minRtt = result.maxRtt = result.avgRtt = 0;
        }
      }

      resolve({
        ...result,
        duration: duration / 1000, // Convertir a segundos
      });
    });
  });
}

async function main() {
  const start = performance.now();
  const results = await Promise.all(
    addresses.map((address) => {
      console.log(`Pinging ${address}...`);
      return pingAddress(address).catch((error) => {
        console.error(`Error pinging ${address}:`, error);
        return {
          addr: address,
          packetsSent: packetCount,
          packetsRecv: 0,
          packetLoss: 100,
          minRtt: Infinity,
          avgRtt: 0,
          maxRtt: -Infinity,
          duration: 0,
        };
      });
    })
  );

  const totalDuration = performance.now() - start;

  for (const result of results) {
    console.log(`\n--- Ping statistics for ${result.addr} ---`);
    console.log(
      `${result.packetsSent} packets transmitted, ${
        result.packetsRecv
      } packets received, ${result.packetLoss.toFixed(2)}% packet loss`
    );
    console.log(
      `round-trip min/avg/max = ${result.minRtt.toFixed(
        2
      )}ms/${result.avgRtt.toFixed(2)}ms/${result.maxRtt.toFixed(2)}ms`
    );
  }

  console.log(
    `\nTotal time for all pings: ${totalDuration.toFixed(2) / 1000} seconds`
  );
  console.log("\nPress Enter to exit...");
  rl.question("", () => {
    rl.close();
  });
}

main();
