import matplotlib.pyplot as plt
from datetime import datetime
import json
import time

data = json.loads(open("./data/node.json", "r", encoding="utf-8").read())

t = []
s = []
n = []

for i in data[len(data)-1]["data"]:
    n.append(i["name"])

for i in range(0, len(data)):
    if data[i]["time"] > (time.time() - 24*60*60)*1000:
        thistime = datetime.fromtimestamp(
            int(data[i]["time"]/1000)).strftime('%H:%M')
        t.append(thistime)

        l = []
        for ii in range(0, len(data[i]["data"])):
            l.append((data[i]["data"][ii]["in"] + data[i]["data"][ii]["out"]) -
                     (data[i-1]["data"][ii]["in"] + data[i-1]["data"][ii]["out"]))
        s.append(l)

scores = []
max = 0

for i in s:
    if len(i) > max:
        max = len(i)

for i in range(0, max):
    l = []
    try:
        for ii in s:
            l.append(ii[i] / (1024 ** 3))
    except:
        pass
    scores.append(l)

plt.figure(figsize=(15, 10))

for i in range(0, max):
    plt.plot(t, scores[i], label='{}'.format(n[i]))

plt.xticks(rotation=320)
plt.grid(True)
plt.ylabel("Transfer (GB)", fontdict={'size': 16})
plt.legend()
plt.tight_layout()
plt.rcParams['axes.unicode_minus'] = False
plt.savefig('t.png')
