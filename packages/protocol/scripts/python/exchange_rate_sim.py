"""
Generates Gold/Dollar exchange rates with predetermined start and end value.
Geometric Brownian Motion is used as Brownian Motion could drop below zero.
Exchange rate is roughly in line with what we model in the stability analysis.

"""

import numpy as np
import matplotlib.pyplot as plt
import csv
import time

# Parameters we could change
# 6 is decent
np.random.seed(9)  # Change this to get a different path with same paramters
ex_rate_start = 10000  # Exchange rate at launch of pilot
ex_rate_end = 15000 # Currently not exactly 2 to make it seem "more random" to users
T = 40  # Number of days
annual_vola = 0.05  # Volatility parameter
dt = 1.0/(24 * 6)  # 1 for daily time steps, 1/24 for hourly, ....
precision = 8

# Generate random exchange rate path
N = round(T/dt) + 1
t = np.linspace(0, T, N)
dW = np.random.randn(N-1)
log_end_val = np.log(ex_rate_end/ex_rate_start)

W = annual_vola * np.append(0, np.cumsum(dW)*np.sqrt(dt))  # Brownian Motion
W_bridge = W - t/T * (W[-1] - log_end_val)  # Adjusted Brownian Motion
ex_rates = ex_rate_start*np.exp(W_bridge)

plt.plot(t, ex_rates)
plt.show()
with open('./exchange_rates/oracle_exchange_rates.csv', 'w') as csvfile:
    writer = csv.writer(csvfile, delimiter=',',
                            quotechar='|', quoting=csv.QUOTE_MINIMAL)
    timestamp = int(time.time())
    writer.writerow(['timestamp', 'stableValue', 'goldValue'])
    for i, rate in enumerate(ex_rates):
        writer.writerow([timestamp + i * dt * 24 * 60 * 60, int(rate * 1000), int(ex_rate_start * 1000)])
