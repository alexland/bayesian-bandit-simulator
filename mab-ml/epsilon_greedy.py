#!/usr/local/bin/python3


'''
while epsilon is normally a fixed value, I've implemented a method 
called get_epsilon() which produces a variable value based on 
the total amount of feedback. Let's take a look at what 
the embedded equation looks like using ggplot
'''

__filename__ = "bandits.py"

import numpy as NP

class EpsilonGreedy(object):
    def __init__(self,n_arms,epsilon_decay=50):
        self.counts = [0] * n  # example: number of views
        self.values = [0.] * n # example: number of clicks / views
        self.decay = epsilon_decay
        self.n = n_arms

    def choose_arm(self):
        """Choose an arm for testing"""
        epsilon = self.get_epsilon()
        if NP.random.random() > epsilon:
            # Exploit (use best arm)
            return NP.argmax(self.values)
        else:
            # Explore (test all arms)
            return NP.random.randint(self.n)

    def update(self,arm,reward):
        """
        update an arm with some reward value
        example: click = 1; no click = 0
        """ 
        self.counts[arm] = self.counts[arm] + 1
        n = self.counts[arm]
        value = self.values[arm]
        # Running product
        new_value = ((n - 1) / float(n)) * value + (1 / float(n)) * reward
        self.values[arm] = new_value

    def get_epsilon(self):
        """
        calculate epsilon
        """
        total = NP.sum(arm_counts)
        return float(self.decay) / (total + float(self.decay))



from ggplot import *
%matplotlib inline

ggplot(pd.DataFrame({'x':[0,500]}),aes(x='x')) + \
    stat_function(fun = lambda x: 50. / (x + 50.)) + \
    ggtitle("Epsilon decay over time") + \
    xlab("amount of feedback") + ylab("epsilon (probability of testing)")