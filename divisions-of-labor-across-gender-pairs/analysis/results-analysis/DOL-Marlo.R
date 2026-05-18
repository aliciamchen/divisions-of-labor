setwd(dirname(rstudioapi::getActiveDocumentContext()$path))

install.packages("tidyboot")
library(tidyboot)
library(tidyverse)
library(ggplot2)
library(dplyr)

theme_set(theme_classic(base_size = 18))

df <- read_csv("my_export.csv")

df <- df %>% filter(!is.na(response_type))
 
df <- df %>% 
  select(-trial_index, -scenario_label, -view_history, -trial_type, -source_json, -time_elapsed, -plugin_version, -slider_start, -rt, -stimulus, -condition_assignment, -attention_passed, -memory_correct_count) %>%
  filter(response_type != "attention_check")

df

df <- df %>% 
  mutate(
    gender_condition = factor(gender_condition, levels = c("female_female", "male_male", "male_female")),
    work_condition = factor(work_condition, levels = c("both_alternate", "division_of_labor", "one_does_all")),
    stage = factor(stage, levels = c("prior", "posterior")),
    response = as.numeric(response) /100  ##??? what is being coerced?
  )

df %>%
  group_by(subject_id, stimulus_index)


df_wide <- df |>
  pivot_wider(
    names_from = stage,
    values_from = response
  ) |>
  mutate(belief_update = posterior - prior)

df_wide #??? why am i getting the NA

#are numbers good?

table(df$stage)



belief_update_summary <- df_wide |>
  group_by(gender_condition, work_condition) |>
  tidyboot_mean(
quantile(stat, na.rm = TRUE)  )

belief_update_summary


####plot with indivisual observations

ggplot(df_wide, aes(x = condition, y = belief_update, color = condition)) +
  geom_hline(yintercept = 0, linetype = "dashed", color = "gray50") +
  geom_jitter(width = 0.1, height = 0, alpha = 0.2, stroke = 0, size = 4) +
  geom_point(data = belief_update_summary,
             aes(x = work_condition, y = empirical_stat, color = gender_condition),
             size = 4) +
  geom_errorbar(data = belief_update_summary,
                aes(x = condition, y = empirical_stat, ymin = ci_lower, ymax = ci_upper),
                width = 0.2, linewidth = 1.2) +
  scale_color_brewer(palette = "Dark2") +
  labs(
    x = "Observed policy",
    y = "Relationship belief update (posterior - prior)",
  ) +
  coord_flip() +
  theme(legend.position = "none")







