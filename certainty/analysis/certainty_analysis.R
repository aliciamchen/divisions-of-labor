#Certainty

#Participants (n=20) read 16 short scenarios about two people who regularly divide two recurring tasks. In each scenario the pair continuously either alternate between tasks or devide them specializing each in one task. Participants made first hierarchy judgments after receiving information about how the characters coordinated the tasks.  Then, participants received information about whether one character “continues to agree that the tasks are equal in effort and value” (agree) or “has started to wonder whether the tasks are really as equal in effort and value” (uncertainty). 
#Note: Condition_assignment was fixed at 0, o all participants viewed the same scenario to condition. (thus scenario is cofunded with condition)


library(tidyverse)
library(lme4)
library(lmerTest)
library(emmeans)

#Loading data, selecting roes that are relevant to the scenarios and analysis, and extracting numeric rating.

df <- read_csv("certainty/data/certainty_data_anonymized.csv")

df <- df %>% mutate(subject_id = anon_id)
ratings <- df %>%
  filter(response_type == "response") %>%
  mutate(rating = as.numeric(str_extract(response, "\\d+(?=\\})"))) %>%
  select(subject_id, scenario_label, category, work_condition,
         certainty_condition, gender_condition, stage, rating)

nrow(ratings)
summary(ratings$rating)
table(ratings$work_condition, ratings$certainty_condition)

#Looking at attention and memory checks

attention <- df %>%
  filter(response_type == "exit_survey") %>%
  select(subject_id, attention_fails, memory_correct_count, attention_passed)

attention
table(attention$attention_passed)

#One did not passed the attention check but passed the memory check, they were kept in the study.

#Calculate and plot belief update

belief_update <- ratings %>%
  pivot_wider(names_from = stage, values_from = rating) %>%
  mutate(update = posterior - prior)

head(belief_update)
nrow(belief_update)

#Below shows which work x certainty condition each scenario appeared in. Here was a check to see that scenario is confunded with condition. 
belief_update %>% #
  count(scenario_label, work_condition, certainty_condition)

participant_means <- belief_update %>%
  group_by(subject_id, work_condition, certainty_condition) %>%
  summarise(prior     = mean(prior),
            posterior = mean(posterior),
            update    = mean(update),
            .groups   = "drop")


pretty_label <- function(x) {
  lookup <- c(both_alternate    = "Alternating",
              division_of_labor = "Division of Labor",
              one_does_all      = "One Does All",
              uncertain         = "Uncertain",
              certain           = "Certain")
  ifelse(x %in% names(lookup), lookup[x], str_to_title(str_replace_all(x, "_", " ")))
}

direction_colors <- c("Increased" = "#e66101",
                      "Decreased" = "#008837",
                      "No change" = "#2166ac")

y_label <- "Perceived hierarchy\n(0 = Completely equal, 6 = Extremely hierarchical)"

#Participants mean

plot_data <- participant_means %>%
  mutate(direction = case_when(posterior > prior ~ "Increased",
                               posterior < prior ~ "Decreased",
                               TRUE              ~ "No change")) %>%
  pivot_longer(c(prior, posterior), names_to = "stage", values_to = "rating") %>%
  mutate(stage = factor(stage, levels = c("prior", "posterior"),
                        labels = c("Prior", "Posterior")))

plot_summary <- plot_data %>%
  group_by(work_condition, certainty_condition, stage) %>%
  summarise(mean = mean(rating),
            se   = sd(rating) / sqrt(n()),
            .groups = "drop")

participant_plot <- ggplot(plot_data, aes(x = stage, y = rating)) +
  geom_violin(trim = FALSE, fill = "grey90", color = "grey60") +
  geom_line(aes(group = subject_id, color = direction), alpha = 0.5) +
  geom_errorbar(data = plot_summary,
                aes(y = mean, ymin = mean - 1.96 * se, ymax = mean + 1.96 * se),
                width = 0.06, linewidth = 0.8) +
  geom_point(data = plot_summary, aes(y = mean), shape = 18, size = 3) +
  facet_grid(certainty_condition ~ work_condition,
             labeller = as_labeller(pretty_label)) +
  scale_color_manual(values = direction_colors) +
  scale_y_continuous(breaks = 0:6) +
  labs(x = NULL, y = y_label,
       title = "Belief update: mean per participant",
       subtitle = "Diamond = mean, error bars = 95% CI",
       color = "Direction of update") +
  theme_minimal(base_size = 13) +
  theme(plot.title = element_text(face = "bold"),
        strip.text = element_text(face = "bold"),
        legend.position = "bottom")

participant_plot

set.seed(1)

#Indvidual rating plot 


trial_lines <- belief_update %>%
  mutate(jit = runif(n(), -0.1, 0.1),
         direction = case_when(update > 0 ~ "Increased",
                               update < 0 ~ "Decreased",
                               TRUE       ~ "No change")) %>%
  pivot_longer(c(prior, posterior), names_to = "stage", values_to = "rating") %>%
  mutate(stage_num  = if_else(stage == "prior", 0, 1),
         rating_jit = rating + jit)

trial_summary <- trial_lines %>%
  group_by(work_condition, certainty_condition, stage_num) %>%
  summarise(mean = mean(rating),
            se   = sd(rating) / sqrt(n()),
            .groups = "drop")

individual_ratings_plot <- ggplot(trial_lines, aes(x = stage_num)) +
  geom_violin(aes(y = rating, group = stage_num), trim = FALSE,
              fill = "grey90", alpha = 0.6, color = "grey60", linewidth = 0.4) +
  geom_line(aes(y = rating_jit, group = interaction(subject_id, scenario_label),
                color = direction),
            alpha = 0.25, linewidth = 0.6) +
  geom_errorbar(data = trial_summary,
                aes(ymin = mean - 1.96 * se, ymax = mean + 1.96 * se),
                width = 0.06, linewidth = 0.8) +
  geom_point(data = trial_summary, aes(y = mean), shape = 18, size = 3) +
  facet_grid(certainty_condition ~ work_condition,
             labeller = as_labeller(pretty_label)) +
  scale_color_manual(values = direction_colors) +
  scale_x_continuous(breaks = c(0, 1), labels = c("Prior", "Posterior"),
                     limits = c(-0.6, 1.6)) +
  scale_y_continuous(breaks = 0:6) +
  labs(x = NULL, y = y_label, color = "Direction of update") +
  theme_minimal(base_size = 13) +
  theme(panel.grid.minor = element_blank(),
        strip.text = element_text(face = "bold"),
        legend.position = "bottom") +
  guides(color = guide_legend(override.aes = list(alpha = 1, linewidth = 1.5)))

individual_ratings_plot

#Saving graphs

fig_dir <- "certainty/figures"
dir.create(fig_dir, showWarnings = FALSE)

plots <- list(
  participant_means_plot  = participant_plot,         #Plot 1
  individual_ratings_plot = individual_ratings_plot   #Plot 2
)

for (name in names(plots)) {
  ggsave(file.path(fig_dir, paste0(name, ".png")),
         plots[[name]], width = 10, height = 8, dpi = 300, bg = "white")
}

list.files(fig_dir)

#Main Stats

belief_update <- belief_update %>%
  mutate(work_condition = factor(work_condition),
         certainty_condition = factor(certainty_condition),
         subject_id = factor(subject_id),
         scenario_label = factor(scenario_label))

m_update <- lmer(update ~ work_condition*certainty_condition +
                   (1 | subject_id) + (1 | scenario_label),
                 data = belief_update)

summary(m_update)
anova(m_update)

#Estimated average update (posterior - prior) for each of the 4 conditions
cell_means <- emmeans(m_update, ~ work_condition * certainty_condition)
test(cell_means, adjust = "holm")

#Comparing agree vs. uncertain, separately for Alternating and for Division of Labor
pairs(emmeans(m_update, ~certainty_condition | work_condition), adjust = "holm")

#Other exploratory analysis: What direction do participants shift to?

participants_direction <- belief_update %>%
  group_by(subject_id, work_condition, certainty_condition) %>%
  summarise(mean_update = mean(update), .groups = "drop") %>%
  mutate(direction = case_when(
    mean_update <= -0.5 ~ "toward equal",
    mean_update >= 0.5 ~ "toward hierarchical", 
    TRUE              ~ "no change"
  ))

participants_direction %>%
  count(work_condition, certainty_condition, direction) %>%
  print(n = Inf)

sign_tests <- participants_direction %>%
  filter(mean_update !=0) %>%
  group_by(work_condition, certainty_condition) %>%
  summarise(n_movers = n(),
            n_toward_equal = sum(mean_update < 0),
            p = binom.test(n_toward_equal, n_movers, p = 0.5)$p.value,
            .groups = "drop") %>%
  mutate(p_holm = p.adjust(p, method = "holm"))

sign_tests
