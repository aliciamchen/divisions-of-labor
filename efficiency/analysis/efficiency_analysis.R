#Efficiency 

#Participants (n=20) read 16 short scenarios about two people who regularly divide two recurring tasks. In each scenario the pair continuously either alternate between tasks or divide them specializing each in one task, and dividing the tasks "saves a great deal of time and effort" compared to alternating (high efficiency gain) or "only a little time and effort" compared to alternating (low efficiency gain). Participants then provided a single hierarchy rating for each scenario. For one scenario per condition, we also included a written "explain your answer" box to gain insight into the reasoning participants used and which parts of the vignette contributed to their judgments.
#Note: Condition_assignment was fixed at 0, o all participants viewed the same scenario to condition. (thus scenario is cofunded with condition)

library(tidyverse)
library(lme4)
library(lmerTest)
library(emmeans)

#Loading the data

df <- read_csv("efficiency/data/efficiency0_data.csv")
df <- df %>% mutate(subject_id= anon_id)

names(df)
n_distinct(df$subject_id)

table(df$response_type)
table(df$stage)
table(df$work_condition, df$efficiency_condition)

#Attention checks 

attention <- df %>%
  filter(response_type == "exit_survey") %>%
  select(subject_id, attention_fails, attention_passed)

attention
table(attention$attention_passed)


#Main stats. Hierarchy ratings, one per scenario, 

ratings <- df  %>%
  filter(response_type == "response") %>%
  select(subject_id,scenario_label, category, work_condition, efficiency_condition, gender_condition, matches_default, has_explanation_prompt, hierarchy_rating, response, explanation)
head(ratings$hierarchy_rating)
head(ratings$response)
summary(ratings$hierarchy_rating)           
table(ratings$matches_default)           
table(ratings$has_explanation_prompt)        

ratings <- ratings %>%
  mutate(efficiency_condition = factor(efficiency_condition,
                                      levels = c("low", "high"),
                                      labels = c("low", "high")),
         work_condition = factor(work_condition,
                                 levels = c("both_alternate", "division_of_labor"),
                                 labels = c("Alternating", "Division of Labor")))
ratings_summary <- ratings %>%
  group_by(efficiency_condition,work_condition)%>%
  summarise(mean = mean(hierarchy_rating),
            se = sd(hierarchy_rating) / sqrt(n()),
            n = n(), 
            .groups= "drop") %>%
  mutate(ci_low= mean -1.96 * se,
         ci_high= mean +1.96 * se)
ratings_summary

m_rating <- lmer(hierarchy_rating ~ work_condition * efficiency_condition +
                   (1 | subject_id) + (1 | scenario_label),
                 data = ratings)

summary(m_rating)
anova(m_rating)

#Other exploratory analysis

#low vs. high efficiency gain change ratings (separate for alternating and division of labor)
pairs(emmeans(m_rating, ~ efficiency_condition | work_condition),
      by= NULL, adjust = "holm")
#is division of labor rated more hierchical than alternating 
pairs(emmeans(m_rating, ~ work_condition | efficiency_condition),
      by= NULL, adjust = "holm")


#Plot

set.seed(1)

dodge <- position_dodge(width = 0.6)
efficiency_plot <- ggplot(ratings, aes(x=efficiency_condition, y = hierarchy_rating,
                                        color = work_condition))+
  geom_point(position = position_jitterdodge(jitter.width = 0.25, jitter.height = 0.1,
                                             dodge.width = 0.6),
             alpha = 0.45, size = 1.8) +
    geom_errorbar(data = ratings_summary,
                  aes(y= mean, ymin = ci_low, ymax = ci_high, group = work_condition),
                  position = dodge, width = 0.12, linewidth = 0.6, color = "black") +
    geom_point(data = ratings_summary,
               aes(y = mean, group = work_condition),
               position = dodge, shape = 18, size = 4, color = "black") +
    scale_color_manual(values= c("Alternating" = "#8c6d4f",
                                 "Division of Labor" = "#c51b7d")) + 
    scale_y_continuous(breaks = seq(0, 6, 2)) +
    labs(x = "Efficiency gain of division of labor",
         y = "Hierarchy rating (0 = equal, 6 = hierarchical)",
         title = "Hierarchy ratings by efficiency gain of division of labor",
         color = "Work condition") + 
    theme_minimal(base_size = 13) +
    theme(panel.grid.minor = element_blank(),
          legend.position = "bottom")
    
efficiency_plot

#Saving the plot

fig_dir <- "efficiency/figures"
dir.create(fig_dir, showWarnings = FALSE)
ggsave(file.path(fig_dir, "efficiency_ratings_plot.png"),
       efficiency_plot, width = 10, height = 8, dpi = 300, bg = "white")
list.files(fig_dir)


